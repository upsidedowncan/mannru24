import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

const CANDLE_DURATION = 10_000;
const MAX_CANDLES = 100;
const CRASH_THRESHOLD = 100_000;
const STARTING_PRICE = 0.1;
// Max ±% move per candle (volatility)
const VOLATILITY = 0.06;

/**
 * Tiny seeded PRNG — mulberry32.
 * Returns a float in [0, 1) deterministically from a uint32 seed.
 * This lets us rebuild any historical candle price purely from its index
 * without storing every tick in the DB.
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Compute the close price of candle at `index` given the market's seed and base.
 * We replay the random walk from candle 0 up to `index` — this is O(n) but
 * n is capped at MAX_CANDLES (100) so it's instant.
 */
function closePriceAt(index: number, marketSeed: number, basePrice: number): number {
  let price = basePrice;
  for (let i = 0; i <= index; i++) {
    const rng = mulberry32(marketSeed ^ (i * 2654435761));
    // 50/50 direction + random magnitude up to VOLATILITY
    const direction = rng() < 0.5 ? 1 : -1;
    const magnitude = rng() * VOLATILITY;
    price = Math.max(0.001, price * (1 + direction * magnitude));
  }
  return price;
}

/**
 * Build a full OHLC candle for the given index.
 * Open = previous candle's close (or basePrice for index 0).
 * We sample 5 intra-candle ticks using sub-seeds for realistic wicks.
 */
function buildCandle(
  index: number,
  candleStartMs: number,
  marketSeed: number,
  basePrice: number
): { time: number; open: number; high: number; low: number; close: number } {
  const open = index === 0 ? basePrice : closePriceAt(index - 1, marketSeed, basePrice);
  const close = closePriceAt(index, marketSeed, basePrice);

  // Generate a few intra-candle samples for realistic H/L wicks
  const samples = [open, close];
  for (let t = 1; t <= 3; t++) {
    const tickRng = mulberry32(marketSeed ^ ((index * 7 + t) * 2654435761));
    const dir = tickRng() < 0.5 ? 1 : -1;
    const mag = tickRng() * (VOLATILITY / 2);
    samples.push(Math.max(0.001, open * (1 + dir * mag)));
  }

  return {
    time: candleStartMs,
    open,
    high: Math.max(...samples),
    low: Math.min(...samples),
    close,
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

  // Derive a stable seed from the market's start time so the walk is
  // reproducible across server restarts but unique per market session.
  const marketSeed = (market.startTime >>> 0) ^ 0xdeadbeef;

  // Figure out which candle indices we need
  const totalElapsed = now - market.startTime;
  const currentCandleIndex = Math.floor(totalElapsed / CANDLE_DURATION);

  // Build / refresh closed candles (trim to MAX_CANDLES)
  const startIndex = Math.max(0, currentCandleIndex - MAX_CANDLES);
  const closedCandles = [];
  for (let i = startIndex; i < currentCandleIndex; i++) {
    closedCandles.push(
      buildCandle(
        i,
        market.startTime + i * CANDLE_DURATION,
        marketSeed,
        market.basePrice
      )
    );
  }

  // Current price = close of last completed candle + partial move into current candle
  const lastClose =
    currentCandleIndex > 0
      ? closePriceAt(currentCandleIndex - 1, marketSeed, market.basePrice)
      : market.basePrice;

  const elapsedInCandle = totalElapsed % CANDLE_DURATION;
  const partialFraction = elapsedInCandle / CANDLE_DURATION;
  const targetClose = closePriceAt(currentCandleIndex, marketSeed, market.basePrice);
  // Linear interpolation so the price moves smoothly within the candle
  const currentPrice = lastClose + (targetClose - lastClose) * partialFraction;

  // Current (forming) candle
  const ccOpen = lastClose;
  const ccSamples = [ccOpen, currentPrice];
  const currentCandle = {
    time: market.startTime + currentCandleIndex * CANDLE_DURATION,
    open: ccOpen,
    high: Math.max(...ccSamples),
    low: Math.min(...ccSamples),
  };

  // Crash check
  if (currentPrice >= CRASH_THRESHOLD) {
    market.crashed = true;
    writeDb(db);
    return NextResponse.json({
      price: currentPrice,
      candles: closedCandles,
      currentCandle,
      mnkHoldings: user?.mnkHoldings ?? 0,
      crashed: true,
      priceChangePercent: 0,
    });
  }

  // Only write when the candles array actually changed
  const prevCount = market.candles.length;
  market.candles = closedCandles;
  if (market.candles.length !== prevCount) {
    writeDb(db);
  }

  const firstPrice = closedCandles.length > 0 ? closedCandles[0].open : currentPrice;
  const priceChangePercent =
    firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;

  return NextResponse.json({
    price: currentPrice,
    candles: closedCandles,
    currentCandle,
    mnkHoldings: user?.mnkHoldings ?? 0,
    crashed: false,
    priceChangePercent,
  });
}
