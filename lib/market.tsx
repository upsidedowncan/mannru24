"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useProgression } from "@/lib/progression";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CurrentCandle {
  open: number;
  high: number;
  low: number;
}

interface MarketContextType {
  price: number;
  priceTrend: "up" | "down" | "neutral";
  candles: Candle[];
  currentCandle: CurrentCandle | null;
  mnkHoldings: number;
  isCrashed: boolean;
  priceChangePercent: number;
  buy: (mrAmount: number) => Promise<{ success: boolean; error?: string }>;
  sell: (mnkAmount: number) => Promise<{ success: boolean; error?: string }>;
  resetCrash: () => void;
  refreshHoldings: () => Promise<void>;
}

const MarketContext = createContext<MarketContextType | null>(null);

const STARTING_PRICE = 0.1;
const CANDLE_MS = 10_000;
const TICK_MS = 400;
const MAX_CANDLES = 50;
const CRASH_THRESHOLD = 100_000;

function brownian(p: number, vol: number): number {
  // Approximate normal distribution via sum of uniforms
  let r = 0;
  for (let i = 0; i < 6; i++) r += Math.random();
  r = (r - 3) / 3;
  return Math.max(0.001, p + p * 0.014 * vol * r);
}

function MarketProviderInner({ children }: { children: ReactNode }) {
  const { xp, level } = useProgression();

  const priceRef = useRef(STARTING_PRICE);
  const prevPriceRef = useRef(STARTING_PRICE);
  const volRef = useRef(1.0);
  const candleRef = useRef<{ time: number; open: number; high: number; low: number }>({
    time: Date.now(),
    open: STARTING_PRICE,
    high: STARTING_PRICE,
    low: STARTING_PRICE,
  });
  const crashedRef = useRef(false);

  const prevXpRef = useRef(xp);
  const prevLevelRef = useRef(level);
  const prevBalanceRef = useRef<number | null>(null);

  const [price, setPrice] = useState(STARTING_PRICE);
  const [priceTrend, setPriceTrend] = useState<"up" | "down" | "neutral">("neutral");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentCandle, setCurrentCandle] = useState<CurrentCandle | null>(null);
  const [mnkHoldings, setMnkHoldings] = useState(0);
  const [isCrashed, setIsCrashed] = useState(false);

  const refreshHoldings = useCallback(async () => {
    try {
      const res = await fetch("/api/investments/holdings");
      if (res.ok) {
        const d = await res.json();
        setMnkHoldings(d.mnkHoldings ?? 0);
      }
    } catch {}
  }, []);

  const buy = useCallback(async (mrAmount: number): Promise<{ success: boolean; error?: string }> => {
    const currentPrice = priceRef.current;
    try {
      const res = await fetch("/api/investments/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mrAmount, price: currentPrice }),
      });
      const d = await res.json();
      if (res.ok) {
        setMnkHoldings(d.mnkHoldings);
        const impact = mrAmount / (currentPrice * 10_000);
        volRef.current = Math.min(volRef.current + Math.sqrt(impact) * 2, 10);
        priceRef.current = Math.min(currentPrice * (1 + impact * 0.6), CRASH_THRESHOLD - 1);
        return { success: true };
      }
      return { success: false, error: d.error };
    } catch {
      return { success: false, error: "Связь с биржей утеряна" };
    }
  }, []);

  const sell = useCallback(async (mnkAmount: number): Promise<{ success: boolean; error?: string }> => {
    const currentPrice = priceRef.current;
    try {
      const res = await fetch("/api/investments/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mnkAmount, price: currentPrice }),
      });
      const d = await res.json();
      if (res.ok) {
        setMnkHoldings(d.mnkHoldings);
        const sellValue = mnkAmount * currentPrice;
        const impact = sellValue / (currentPrice * 10_000);
        volRef.current = Math.min(volRef.current + Math.sqrt(impact) * 2, 10);
        priceRef.current = Math.max(currentPrice * (1 - impact * 0.5), 0.001);
        return { success: true };
      }
      return { success: false, error: d.error };
    } catch {
      return { success: false, error: "Связь с биржей утеряна" };
    }
  }, []);

  const resetCrash = useCallback(() => {
    crashedRef.current = false;
    priceRef.current = STARTING_PRICE;
    prevPriceRef.current = STARTING_PRICE;
    volRef.current = 1.0;
    const now = Date.now();
    candleRef.current = { time: now, open: STARTING_PRICE, high: STARTING_PRICE, low: STARTING_PRICE };
    setPrice(STARTING_PRICE);
    setPriceTrend("neutral");
    setCandles([]);
    setCurrentCandle({ open: STARTING_PRICE, high: STARTING_PRICE, low: STARTING_PRICE });
    setMnkHoldings(0);
    setIsCrashed(false);
  }, []);

  // React to XP/level changes — pumps the market
  useEffect(() => {
    if (crashedRef.current) return;
    const xpDelta = xp - prevXpRef.current;
    const levelDelta = level - prevLevelRef.current;
    if (xpDelta > 0) {
      const boost = Math.sqrt(xpDelta) * 0.6;
      volRef.current = Math.min(volRef.current + boost, 12);
      if (levelDelta > 0) {
        priceRef.current = Math.min(
          priceRef.current * (1.2 + 0.15 * levelDelta),
          CRASH_THRESHOLD - 1
        );
      } else {
        priceRef.current = Math.min(
          priceRef.current * (1 + xpDelta * 0.003),
          CRASH_THRESHOLD - 1
        );
      }
    }
    prevXpRef.current = xp;
    prevLevelRef.current = level;
  }, [xp, level]);

  // Poll card balances to detect external transactions/DEV tool activity
  useEffect(() => {
    const poll = async () => {
      if (crashedRef.current) return;
      try {
        const res = await fetch("/api/cards");
        if (!res.ok) return;
        const cards = await res.json();
        const total: number = Array.isArray(cards)
          ? cards.reduce((s: number, c: any) => s + (c.balance ?? 0), 0)
          : 0;
        if (prevBalanceRef.current !== null && total !== prevBalanceRef.current) {
          const delta = total - prevBalanceRef.current;
          const absImpact = Math.sqrt(Math.abs(delta)) / 80;
          volRef.current = Math.min(volRef.current + absImpact, 12);
          if (delta > 0) {
            priceRef.current = Math.min(
              priceRef.current * (1 + absImpact * 0.12),
              CRASH_THRESHOLD - 1
            );
          } else {
            priceRef.current = Math.max(
              priceRef.current * (1 - absImpact * 0.09),
              0.001
            );
          }
        }
        prevBalanceRef.current = total;
      } catch {}
    };
    poll();
    const id = setInterval(poll, 3_000);
    return () => clearInterval(id);
  }, []);

  // Initial load
  useEffect(() => {
    refreshHoldings();
    const now = Date.now();
    candleRef.current = { time: now, open: STARTING_PRICE, high: STARTING_PRICE, low: STARTING_PRICE };
    setCurrentCandle({ open: STARTING_PRICE, high: STARTING_PRICE, low: STARTING_PRICE });
  }, [refreshHoldings]);

  // Price simulation tick
  useEffect(() => {
    const tick = () => {
      if (crashedRef.current) return;
      const now = Date.now();
      const p = brownian(priceRef.current, volRef.current);
      volRef.current = Math.max(1.0, volRef.current * 0.986);

      if (p >= CRASH_THRESHOLD) {
        crashedRef.current = true;
        fetch("/api/investments/crash-reset", { method: "POST" }).catch(() => {});
        setMnkHoldings(0);
        setIsCrashed(true);
        return;
      }

      const trend: "up" | "down" | "neutral" =
        p > prevPriceRef.current + 0.00001 ? "up" :
        p < prevPriceRef.current - 0.00001 ? "down" : "neutral";

      prevPriceRef.current = priceRef.current;
      priceRef.current = p;

      const cs = candleRef.current;
      cs.high = Math.max(cs.high, p);
      cs.low = Math.min(cs.low, p);
      setCurrentCandle({ open: cs.open, high: cs.high, low: cs.low });

      if (now - cs.time >= CANDLE_MS) {
        const closed: Candle = {
          time: cs.time,
          open: cs.open,
          high: cs.high,
          low: cs.low,
          close: p,
        };
        setCandles(prev => [...prev, closed].slice(-MAX_CANDLES));
        candleRef.current = { time: now, open: p, high: p, low: p };
        setCurrentCandle({ open: p, high: p, low: p });
      }

      setPrice(p);
      setPriceTrend(trend);
    };

    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const priceChangePercent =
    candles.length > 0 ? ((price - candles[0].open) / candles[0].open) * 100 : 0;

  return (
    <MarketContext.Provider
      value={{
        price,
        priceTrend,
        candles,
        currentCandle,
        mnkHoldings,
        isCrashed,
        priceChangePercent,
        buy,
        sell,
        resetCrash,
        refreshHoldings,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function MarketProvider({ children }: { children: ReactNode }) {
  return <MarketProviderInner>{children}</MarketProviderInner>;
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used within MarketProvider");
  return ctx;
}
