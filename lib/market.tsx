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

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CurrentCandle {
  time: number;
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

const POLL_INTERVAL = 1500;

export function MarketProvider({ children }: { children: ReactNode }) {
  const [price, setPrice] = useState(0.1);
  const [priceTrend, setPriceTrend] = useState<"up" | "down" | "neutral">("neutral");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentCandle, setCurrentCandle] = useState<CurrentCandle | null>(null);
  const [mnkHoldings, setMnkHoldings] = useState(0);
  const [isCrashed, setIsCrashed] = useState(false);
  const [priceChangePercent, setPriceChangePercent] = useState(0);

  const prevPriceRef = useRef(0.1);
  const priceRef = useRef(0.1);

  const applyMarketData = useCallback((d: {
    price: number;
    candles: Candle[];
    currentCandle: CurrentCandle | null;
    mnkHoldings: number;
    crashed: boolean;
    priceChangePercent: number;
  }) => {
    const newPrice = d.price;
    const trend: "up" | "down" | "neutral" =
      newPrice > prevPriceRef.current + 0.000001 ? "up" :
      newPrice < prevPriceRef.current - 0.000001 ? "down" : "neutral";
    prevPriceRef.current = newPrice;
    priceRef.current = newPrice;

    setPrice(newPrice);
    setPriceTrend(trend);
    setCandles(d.candles ?? []);
    setCurrentCandle(d.currentCandle ?? null);
    setMnkHoldings(d.mnkHoldings ?? 0);
    setIsCrashed(d.crashed ?? false);
    setPriceChangePercent(d.priceChangePercent ?? 0);
  }, []);

  const fetchMarket = useCallback(async () => {
    try {
      const res = await fetch("/api/investments/market");
      if (!res.ok) return;
      applyMarketData(await res.json());
    } catch {}
  }, [applyMarketData]);

  const refreshHoldings = useCallback(async () => {
    await fetchMarket();
  }, [fetchMarket]);

  const buy = useCallback(
    async (mrAmount: number): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/investments/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mrAmount, price: priceRef.current }),
        });
        const d = await res.json();
        if (res.ok) {
          await fetchMarket();
          return { success: true };
        }
        return { success: false, error: d.error };
      } catch {
        return { success: false, error: "Связь с биржей утеряна" };
      }
    },
    [fetchMarket]
  );

  const sell = useCallback(
    async (mnkAmount: number): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/investments/sell", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mnkAmount, price: priceRef.current }),
        });
        const d = await res.json();
        if (res.ok) {
          await fetchMarket();
          return { success: true };
        }
        return { success: false, error: d.error };
      } catch {
        return { success: false, error: "Связь с биржей утеряна" };
      }
    },
    [fetchMarket]
  );

  const resetCrash = useCallback(() => {
    fetch("/api/investments/crash-reset", { method: "POST" })
      .then(() => fetchMarket())
      .catch(() => {});
  }, [fetchMarket]);

  useEffect(() => {
    fetchMarket();
    const id = setInterval(fetchMarket, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchMarket]);

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

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used within MarketProvider");
  return ctx;
}
