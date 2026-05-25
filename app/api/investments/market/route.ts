import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

const CANDLE_DURATION = 10_000;
const SINE_PERIOD = 90_000;
const SINE_AMPLITUDE = 0.4;
const MAX_CANDLES = 100;
const CRASH_THRESHOLD = 100_000;
const STARTING_PRICE = 0.1;

function priceAt(elapsedMs: number, base: number): number {
  return base * (1 + SINE_AMPLITUDE * Math.sin((2 * Math.PI * elapsedMs) / SINE_PERIOD));
}

function buildCandle(candleStartMs: number, startTime: number, base: number) {
  const e0 = candleStartMs - startTime;
  const samples = [0, 0.25, 0.5, 0.75, 1].map((t) =>
    priceAt(e0 + t * CANDLE_DURATION, base)
  );
  return {
    time: candleStartMs,
    open: priceAt(e0, base),
    high: Math.max(...samples),
    low: Math.min(...samples),
    close: priceAt(e0 + CANDLE_DURATION, base),
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDb();

  if (!db.mnkMarket) {
    db.mnkMarket = {
      basePrice: STARTING_PRICE,
      startTime: Date.now(),
      candles: [],
      crashed: false,
    };
    writeDb(db);
  }

  const market = db.mnkMarket;
  const user = db.users.find((u) => u.id === session.user.id);

  if (market.crashed) {
    return NextResponse.json({
      price: STARTING_PRICE,
      candles: [],
      currentCandle: null,
      mnkHoldings: user?.mnkHoldings ?? 0,
      crashed: true,
      priceChangePercent: 0,
    });
  }

  const now = Date.now();
  const elapsed = now - market.startTime;
  const currentPrice = priceAt(elapsed, market.basePrice);

  // Determine starting point for candle generation
  const lastStoredEnd =
    market.candles.length > 0
      ? market.candles[market.candles.length - 1].time + CANDLE_DURATION
      : market.startTime;

  // If gap is too large, skip old history to avoid computing thousands of candles
  const maxBackfill = MAX_CANDLES * CANDLE_DURATION;
  let candleStart = lastStoredEnd;
  if (now - candleStart > maxBackfill) {
    const newStart = now - maxBackfill;
    const sincStart = newStart - market.startTime;
    candleStart =
      market.startTime + Math.floor(sincStart / CANDLE_DURATION) * CANDLE_DURATION;
    market.candles = [];
  }

  let didAddCandles = false;
  while (candleStart + CANDLE_DURATION <= now) {
    market.candles.push(buildCandle(candleStart, market.startTime, market.basePrice));
    candleStart += CANDLE_DURATION;
    didAddCandles = true;
  }

  if (market.candles.length > MAX_CANDLES) {
    market.candles = market.candles.slice(-MAX_CANDLES);
  }

  // Build the current forming candle
  const ccE0 = candleStart - market.startTime;
  const elapsedInCandle = now - candleStart;
  const numSamples = Math.max(2, Math.floor(elapsedInCandle / 1000) + 1);
  let cHigh = priceAt(ccE0, market.basePrice);
  let cLow = cHigh;
  for (let i = 1; i <= numSamples; i++) {
    const p = priceAt(ccE0 + (i / numSamples) * elapsedInCandle, market.basePrice);
    if (p > cHigh) cHigh = p;
    if (p < cLow) cLow = p;
  }
  cHigh = Math.max(cHigh, currentPrice);
  cLow = Math.min(cLow, currentPrice);

  const currentCandle = {
    time: candleStart,
    open: priceAt(ccE0, market.basePrice),
    high: cHigh,
    low: cLow,
  };

  if (currentPrice >= CRASH_THRESHOLD) {
    market.crashed = true;
    writeDb(db);
    return NextResponse.json({
      price: currentPrice,
      candles: market.candles,
      currentCandle,
      mnkHoldings: user?.mnkHoldings ?? 0,
      crashed: true,
      priceChangePercent: 0,
    });
  }

  if (didAddCandles) {
    writeDb(db);
  }

  const firstPrice =
    market.candles.length > 0 ? market.candles[0].open : currentCandle.open;
  const priceChangePercent =
    firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;

  return NextResponse.json({
    price: currentPrice,
    candles: market.candles,
    currentCandle,
    mnkHoldings: user?.mnkHoldings ?? 0,
    crashed: false,
    priceChangePercent,
  });
}
