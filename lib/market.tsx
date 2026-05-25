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

interface MarketContextType {
  price: number;
  sessionOpen: number;
  mnkBalance: number;
  mnkAtCrash: number;
  candles: Candle[];
  currentCandle: Partial<Candle>;
  crashed: boolean;
  loadingBalance: boolean;
  buy: (mnkAmount: number, cardId: string, cardBalance: number) => Promise<{ error?: string }>;
  sell: (mnkAmount: number, cardId?: string) => Promise<{ error?: string }>;
  dismissCrash: () => void;
  injectVolume: (amount: number) => void;
}

const MarketContext = createContext<MarketContextType | null>(null);

const TICK_MS = 1800;
const CANDLE_TICKS = 15;
const BASE_PRICE = 0.1;
const CRASH_THRESHOLD = 100_000;
const BASE_VOL = 0.022;

function buildInitCandles(startPrice: number): { candles: Candle[]; lastPrice: number } {
  const candles: Candle[] = [];
  let p = startPrice;
  const now = Date.now();
  for (let i = 0; i < 32; i++) {
    const o = p;
    const drift = (Math.random() - 0.478) * 0.04;
    const c = Math.max(o * (1 + drift), BASE_PRICE * 0.5);
    const swing = Math.random() * 0.012;
    const h = Math.max(o, c) * (1 + swing);
    const l = Math.min(o, c) * (1 - swing);
    candles.push({ time: now - (32 - i) * TICK_MS * CANDLE_TICKS, open: o, high: h, low: l, close: c });
    p = c;
  }
  return { candles, lastPrice: p };
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const [price, setPrice] = useState(BASE_PRICE);
  const [sessionOpen] = useState(BASE_PRICE);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentCandle, setCurrentCandle] = useState<Partial<Candle>>({});
  const [crashed, setCrashed] = useState(false);
  const [mnkBalance, setMnkBalance] = useState(0);
  const [mnkAtCrash, setMnkAtCrash] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  const priceRef = useRef(BASE_PRICE);
  const tickCountRef = useRef(0);
  const currentCandleRef = useRef<Partial<Candle>>({ open: BASE_PRICE, high: BASE_PRICE, low: BASE_PRICE });
  const crashedRef = useRef(false);
  const pendingVolumeRef = useRef(0);
  const prevTotalBalanceRef = useRef<number | null>(null);
  const mnkBalanceRef = useRef(0);

  const fetchMnkBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/investments/mnk");
      if (res.ok) {
        const data = await res.json();
        const bal = data.mnkBalance ?? 0;
        setMnkBalance(bal);
        mnkBalanceRef.current = bal;
      }
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  const pollCardBalances = useCallback(async () => {
    try {
      const res = await fetch("/api/cards");
      if (!res.ok) return;
      const cards: { balance: number }[] = await res.json();
      const total = cards.reduce((s, c) => s + c.balance, 0);
      if (prevTotalBalanceRef.current !== null) {
        const delta = total - prevTotalBalanceRef.current;
        if (Math.abs(delta) > 50) {
          pendingVolumeRef.current += delta;
        }
      }
      prevTotalBalanceRef.current = total;
    } catch {}
  }, []);

  const handleCrash = useCallback(async () => {
    try {
      await fetch("/api/investments/mnk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "crash" }),
      });
    } catch {}
    setMnkBalance(0);
    mnkBalanceRef.current = 0;
    priceRef.current = BASE_PRICE;
    setPrice(BASE_PRICE);
    const { candles: newCandles } = buildInitCandles(BASE_PRICE);
    setCandles(newCandles);
    currentCandleRef.current = { open: BASE_PRICE, high: BASE_PRICE, low: BASE_PRICE };
    setCurrentCandle({ open: BASE_PRICE, high: BASE_PRICE, low: BASE_PRICE });
    tickCountRef.current = 0;
  }, []);

  const tick = useCallback(() => {
    if (crashedRef.current) return;

    const cur = priceRef.current;
    const vol = pendingVolumeRef.current;
    pendingVolumeRef.current = 0;

    let drift = (Math.random() - 0.478) * BASE_VOL;
    if (vol > 0) drift += Math.min(vol / 40000, 0.18);
    else if (vol < 0) drift -= Math.min(Math.abs(vol) / 40000, 0.18);

    const next = Math.max(cur * (1 + drift), BASE_PRICE);
    priceRef.current = next;
    setPrice(next);

    if (next >= CRASH_THRESHOLD && !crashedRef.current) {
      crashedRef.current = true;
      setMnkAtCrash(mnkBalanceRef.current);
      setCrashed(true);
      handleCrash();
      return;
    }

    const cc = currentCandleRef.current;
    if (!cc.open) cc.open = next;
    cc.high = Math.max(cc.high ?? next, next);
    cc.low = Math.min(cc.low ?? next, next);
    cc.close = next;
    setCurrentCandle({ ...cc });

    tickCountRef.current++;
    if (tickCountRef.current % CANDLE_TICKS === 0) {
      const finalized: Candle = {
        time: Date.now(),
        open: cc.open!,
        high: cc.high!,
        low: cc.low!,
        close: next,
      };
      setCandles(prev => [...prev.slice(-59), finalized]);
      currentCandleRef.current = { open: next, high: next, low: next, close: next };
      setCurrentCandle({ open: next, high: next, low: next, close: next });
    }
  }, [handleCrash]);

  const dismissCrash = useCallback(() => {
    crashedRef.current = false;
    setCrashed(false);
  }, []);

  const injectVolume = useCallback((amount: number) => {
    pendingVolumeRef.current += amount;
  }, []);

  const buy = useCallback(async (mnkAmount: number, cardId: string, cardBalance: number): Promise<{ error?: string }> => {
    const cost = mnkAmount * priceRef.current;
    if (mnkAmount <= 0) return { error: "Некорректное количество" };
    if (cost > cardBalance) return { error: "Недостаточно средств на карте" };

    const res = await fetch("/api/investments/mnk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "buy", mnkAmount, cardId, price: priceRef.current }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { error: data.error ?? "Ошибка операции" };
    }
    const data = await res.json();
    setMnkBalance(data.mnkBalance);
    mnkBalanceRef.current = data.mnkBalance;
    pendingVolumeRef.current += cost;
    return {};
  }, []);

  const sell = useCallback(async (mnkAmount: number, cardId?: string): Promise<{ error?: string }> => {
    if (mnkAmount <= 0) return { error: "Некорректное количество" };
    if (mnkAmount > mnkBalanceRef.current) return { error: "Недостаточно MNK" };

    const res = await fetch("/api/investments/mnk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sell", mnkAmount, price: priceRef.current, cardId }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { error: data.error ?? "Ошибка операции" };
    }
    const data = await res.json();
    setMnkBalance(data.mnkBalance);
    mnkBalanceRef.current = data.mnkBalance;
    pendingVolumeRef.current -= mnkAmount * priceRef.current;
    return {};
  }, []);

  useEffect(() => {
    fetchMnkBalance();
    const { candles: initCandles, lastPrice } = buildInitCandles(BASE_PRICE);
    priceRef.current = lastPrice;
    setPrice(lastPrice);
    setCandles(initCandles);
    currentCandleRef.current = { open: lastPrice, high: lastPrice, low: lastPrice, close: lastPrice };
    setCurrentCandle({ open: lastPrice, high: lastPrice, low: lastPrice, close: lastPrice });
  }, [fetchMnkBalance]);

  useEffect(() => {
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [tick]);

  useEffect(() => {
    pollCardBalances();
    const id = setInterval(pollCardBalances, 4000);
    return () => clearInterval(id);
  }, [pollCardBalances]);

  return (
    <MarketContext.Provider
      value={{
        price,
        sessionOpen,
        mnkBalance,
        mnkAtCrash,
        candles,
        currentCandle,
        crashed,
        loadingBalance,
        buy,
        sell,
        dismissCrash,
        injectVolume,
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
