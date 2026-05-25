"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useProgression } from "@/lib/progression";
import { useMarket, type Candle, type CurrentCandle } from "@/lib/market";
import { Lock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Price formatting ────────────────────────────────────────────────────────

function fmtPrice(p: number): string {
  if (p < 0.0001) return p.toExponential(3);
  if (p < 0.01) return p.toFixed(5);
  if (p < 1) return p.toFixed(4);
  if (p < 100) return p.toFixed(2);
  if (p < 10_000) return p.toLocaleString("ru", { maximumFractionDigits: 1 });
  if (p < 1_000_000) return Math.round(p / 1_000) + "K";
  return (p / 1_000_000).toFixed(2) + "M";
}

function fmtMnk(n: number): string {
  if (n === 0) return "0.000000";
  if (n < 0.000001) return n.toExponential(3);
  return n.toFixed(6);
}

// ─── Candlestick Chart ────────────────────────────────────────────────────────

const PAD = { t: 8, r: 56, b: 8, l: 2 };

interface ChartProps {
  candles: Candle[];
  currentCandle: CurrentCandle | null;
  price: number;
}

function CandleChart({ candles, currentCandle, price }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 600, h: 200 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setDims({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  type DisplayCandle = { open: number; high: number; low: number; close: number; live?: true };

  const display: DisplayCandle[] = [
    ...candles.slice(-50),
    ...(currentCandle
      ? [{ open: currentCandle.open, high: currentCandle.high, low: currentCandle.low, close: price, live: true as const }]
      : []),
  ];

  const plotW = dims.w - PAD.l - PAD.r;
  const plotH = dims.h - PAD.t - PAD.b;

  if (display.length === 0) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center text-zinc-600 font-mono text-xs"
      >
        Инициализация рынка...
      </div>
    );
  }

  const allV = display.flatMap((c) => [c.high, c.low]);
  const rawMin = Math.min(...allV);
  const rawMax = Math.max(...allV);
  const range = rawMax - rawMin || rawMax * 0.2;
  const yMin = rawMin - range * 0.06;
  const yMax = rawMax + range * 0.06;

  const n = display.length;
  const cw = plotW / n;
  const bw = Math.max(1.5, cw * 0.56);

  const sy = (v: number) => PAD.t + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const sx = (i: number) => PAD.l + (i + 0.5) * cw;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    price: yMin + (yMax - yMin) * t,
    y: sy(yMin + (yMax - yMin) * t),
  }));

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg width={dims.w} height={dims.h} style={{ display: "block" }}>
        {/* Grid lines */}
        {yTicks.map(({ y }, i) => (
          <line
            key={i}
            x1={PAD.l}
            y1={y}
            x2={dims.w - PAD.r}
            y2={y}
            stroke="#27272a"
            strokeWidth="0.5"
          />
        ))}

        {/* Y axis labels */}
        {yTicks.map(({ price: p, y }, i) => (
          <text
            key={i}
            x={dims.w - PAD.r + 4}
            y={y}
            fill="#52525b"
            fontSize="9"
            fontFamily="monospace"
            dominantBaseline="middle"
          >
            {fmtPrice(p)}
          </text>
        ))}

        {/* Current price dashed line */}
        <line
          x1={PAD.l}
          y1={sy(price)}
          x2={dims.w - PAD.r}
          y2={sy(price)}
          stroke="#3f3f46"
          strokeWidth="0.5"
          strokeDasharray="4,3"
        />

        {/* Candles */}
        {display.map((c, i) => {
          const isGreen = c.close >= c.open;
          const clr = isGreen ? "#22c55e" : "#ef4444";
          const x = sx(i);
          const bodyTop = sy(Math.max(c.open, c.close));
          const bodyBot = sy(Math.min(c.open, c.close));
          const bh = Math.max(1, bodyBot - bodyTop);

          return (
            <g key={i} opacity={c.live ? 0.7 : 1}>
              <line
                x1={x}
                y1={sy(c.high)}
                x2={x}
                y2={sy(c.low)}
                stroke={clr}
                strokeWidth="0.8"
              />
              <rect
                x={x - bw / 2}
                y={bodyTop}
                width={bw}
                height={bh}
                fill={isGreen ? "#22c55e33" : "#ef444433"}
                stroke={clr}
                strokeWidth="0.5"
              />
            </g>
          );
        })}

        {/* Live dot on current candle */}
        {currentCandle && n > 0 && (
          <circle
            cx={sx(n - 1)}
            cy={sy(price)}
            r="2.5"
            fill="#22d3ee"
          />
        )}
      </svg>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InvestmentsPage() {
  const { level } = useProgression();
  const {
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
  } = useMarket();

  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [buyAmt, setBuyAmt] = useState("");
  const [sellAmt, setSellAmt] = useState("");
  const [busy, setBusy] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [showCrash, setShowCrash] = useState(false);
  const crashShownRef = useRef(false);

  const loadCards = useCallback(async () => {
    const res = await fetch("/api/cards");
    if (res.ok) setCards(await res.json());
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    if (isCrashed && !crashShownRef.current) {
      crashShownRef.current = true;
      setShowCrash(true);
    }
  }, [isCrashed]);

  const totalBalance = cards.reduce((s: number, c: any) => s + (c.balance ?? 0), 0);
  const mnkValue = mnkHoldings * price;
  const buyPreview = buyAmt && price > 0 ? parseFloat(buyAmt) / price : null;
  const sellPreview = sellAmt && price > 0 ? parseFloat(sellAmt) * price : null;

  const handleBuy = async () => {
    const amt = parseFloat(buyAmt);
    if (!amt || amt <= 0) { toast.error("Введите сумму"); return; }
    if (amt > totalBalance) { toast.error("Недостаточно средств"); return; }
    setBusy(true);
    const r = await buy(amt);
    if (r.success) {
      toast.success(`Куплено ${fmtMnk(amt / price)} MNK`, {
        description: `Списано ${amt.toLocaleString("ru")} МР`,
      });
      setBuyAmt("");
      loadCards();
    } else {
      toast.error(r.error ?? "Ошибка сделки");
    }
    setBusy(false);
  };

  const handleSell = async () => {
    const amt = parseFloat(sellAmt);
    if (!amt || amt <= 0) { toast.error("Введите количество MNK"); return; }
    if (amt > mnkHoldings) { toast.error("Недостаточно MNK"); return; }
    setBusy(true);
    const r = await sell(amt);
    if (r.success) {
      toast.success(`Продано ${fmtMnk(amt)} MNK`, {
        description: `Зачислено ${(amt * price).toLocaleString("ru", { maximumFractionDigits: 2 })} МР`,
      });
      setSellAmt("");
      loadCards();
    } else {
      toast.error(r.error ?? "Ошибка сделки");
    }
    setBusy(false);
  };

  const handleResetCrash = () => {
    crashShownRef.current = false;
    setShowCrash(false);
    resetCrash();
    loadCards();
    refreshHoldings();
  };

  // ── Lock screen ────────────────────────────────────────────────────────────
  if (level < 15) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <Lock className="w-6 h-6 text-zinc-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Инвестиционный Портал</h1>
          <p className="text-zinc-500 text-sm mt-1.5 max-w-xs leading-relaxed">
            Торговля Маннрублём доступна с&nbsp;15&nbsp;уровня.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 rounded text-[11px] font-mono text-zinc-600 uppercase tracking-widest">
          <Lock className="w-2.5 h-2.5" />
          Уровень 15 · Ваш уровень {level}
        </div>
      </div>
    );
  }

  // ── Trend icon ─────────────────────────────────────────────────────────────
  const TrendIcon =
    priceTrend === "up" ? TrendingUp :
    priceTrend === "down" ? TrendingDown : Minus;
  const trendColor =
    priceTrend === "up" ? "text-emerald-400" :
    priceTrend === "down" ? "text-red-400" : "text-zinc-500";

  return (
    <>
      {/* ── Market Crash Overlay ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCrash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center text-center p-6 select-none"
          >
            <div className="absolute inset-0 bg-red-900/8 pointer-events-none" />
            <p className="text-red-700 font-mono text-[9px] uppercase tracking-[0.25em] mb-8">
              MARKET.EXE // FATAL ERROR // EXIT CODE 0xDEAD
            </p>
            <h1 className="text-[15vw] sm:text-[120px] font-black text-white uppercase leading-none tracking-tighter mb-6 z-10">
              КРАХ<br />МАРКЕТА
            </h1>
            <p className="text-red-500/80 font-mono text-xs mb-1.5 max-w-xs leading-relaxed z-10">
              Курс MNK пробил отметку ₽100,000.
            </p>
            <p className="text-red-800 font-mono text-[10px] mb-10 z-10">
              Все MNK-активы уничтожены. Биржа закрыта.
            </p>
            <button
              onClick={handleResetCrash}
              className="relative z-10 px-6 py-2.5 border border-zinc-800 text-zinc-400 font-mono text-[10px] uppercase tracking-[0.2em] hover:border-zinc-600 hover:text-zinc-200 active:bg-zinc-900 transition-colors rounded"
            >
              Восстановить систему
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto">
        {/* Header row */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">
              Маннрубль · Биржа
            </p>
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span
                className={`text-3xl md:text-4xl font-bold tabular-nums tracking-tight transition-colors duration-200 ${
                  priceTrend === "up" ? "text-emerald-400" :
                  priceTrend === "down" ? "text-red-400" : "text-white"
                }`}
              >
                {fmtPrice(price)}
                <span className="text-zinc-600 text-lg font-normal ml-1">Р</span>
              </span>
              <span
                className={`flex items-center gap-1 text-sm font-mono tabular-nums ${
                  priceChangePercent >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                <TrendIcon className="w-3.5 h-3.5" />
                {priceChangePercent >= 0 ? "+" : ""}
                {priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 border border-zinc-800 rounded bg-zinc-900 shrink-0 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">MNK · live</span>
          </div>
        </div>

        {/* Main panel */}
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          {/* Chart + Trade */}
          <div className="divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 lg:grid lg:grid-cols-3">
            {/* Chart */}
            <div className="lg:col-span-2 p-4 bg-zinc-950">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                  Свечной график · 10&thinsp;с / свеча
                </span>
                <span className="text-[10px] font-mono text-zinc-700">
                  {candles.length + (currentCandle ? 1 : 0)} свечей
                </span>
              </div>
              <div className="h-44 md:h-56">
                <CandleChart candles={candles} currentCandle={currentCandle} price={price} />
              </div>
            </div>

            {/* Trading panel */}
            <div className="bg-zinc-950">
              {/* Portfolio */}
              <div className="p-4 border-b border-zinc-800">
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
                  Брокерский счёт
                </p>
                <p className="text-xl font-bold tabular-nums text-white">
                  {fmtMnk(mnkHoldings)}
                  <span className="text-zinc-600 text-sm font-normal ml-1">MNK</span>
                </p>
                <p className="text-sm text-zinc-500 mt-0.5 tabular-nums">
                  ≈&nbsp;{mnkValue.toLocaleString("ru", { maximumFractionDigits: 2 })}&nbsp;МР
                </p>
                <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between text-xs">
                  <span className="text-zinc-600">Баланс карт</span>
                  <span className="text-zinc-400 tabular-nums font-mono">
                    {totalBalance.toLocaleString("ru")}&nbsp;МР
                  </span>
                </div>
              </div>

              {/* Trade tabs */}
              <div className="p-4">
                <div className="flex rounded overflow-hidden border border-zinc-800 mb-4 text-[11px] font-bold uppercase tracking-widest">
                  <button
                    onClick={() => setTab("buy")}
                    className={`flex-1 py-2 transition-colors ${
                      tab === "buy"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "text-zinc-600 hover:text-zinc-300"
                    } border-r border-zinc-800`}
                  >
                    Купить
                  </button>
                  <button
                    onClick={() => setTab("sell")}
                    className={`flex-1 py-2 transition-colors ${
                      tab === "sell"
                        ? "bg-red-500/10 text-red-400"
                        : "text-zinc-600 hover:text-zinc-300"
                    }`}
                  >
                    Продать
                  </button>
                </div>

                {tab === "buy" && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <label className="text-[10px] font-mono text-zinc-600 uppercase">Сумма&nbsp;МР</label>
                        <button
                          onClick={() => setBuyAmt(String(Math.floor(totalBalance)))}
                          className="text-[10px] font-mono text-zinc-600 hover:text-zinc-300 uppercase transition-colors touch-manipulation"
                        >
                          Макс
                        </button>
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={buyAmt}
                        onChange={(e) => setBuyAmt(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 tabular-nums transition-colors"
                      />
                    </div>
                    {buyPreview !== null && buyPreview > 0 && (
                      <div className="flex justify-between text-xs px-0.5">
                        <span className="text-zinc-600">Получите</span>
                        <span className="text-zinc-300 tabular-nums font-mono">
                          {fmtMnk(buyPreview)}&nbsp;MNK
                        </span>
                      </div>
                    )}
                    <button
                      onClick={handleBuy}
                      disabled={busy || !buyAmt || parseFloat(buyAmt) <= 0}
                      className="w-full py-2.5 border border-emerald-500/20 bg-emerald-500/8 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/30 active:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded text-[11px] font-bold uppercase tracking-widest touch-manipulation"
                    >
                      {busy ? "Исполняем…" : "Купить MNK"}
                    </button>
                  </div>
                )}

                {tab === "sell" && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <label className="text-[10px] font-mono text-zinc-600 uppercase">Количество&nbsp;MNK</label>
                        <button
                          onClick={() => setSellAmt(String(mnkHoldings))}
                          className="text-[10px] font-mono text-zinc-600 hover:text-zinc-300 uppercase transition-colors touch-manipulation"
                        >
                          Макс
                        </button>
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={sellAmt}
                        onChange={(e) => setSellAmt(e.target.value)}
                        placeholder="0.000000"
                        min="0"
                        step="any"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 tabular-nums transition-colors"
                      />
                    </div>
                    {sellPreview !== null && sellPreview > 0 && (
                      <div className="flex justify-between text-xs px-0.5">
                        <span className="text-zinc-600">Получите</span>
                        <span className="text-zinc-300 tabular-nums font-mono">
                          {sellPreview.toLocaleString("ru", { maximumFractionDigits: 2 })}&nbsp;МР
                        </span>
                      </div>
                    )}
                    <button
                      onClick={handleSell}
                      disabled={busy || !sellAmt || parseFloat(sellAmt) <= 0 || mnkHoldings === 0}
                      className="w-full py-2.5 border border-red-500/20 bg-red-500/8 text-red-400 hover:bg-red-500/15 hover:border-red-500/30 active:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded text-[11px] font-bold uppercase tracking-widest touch-manipulation"
                    >
                      {busy ? "Исполняем…" : "Продать MNK"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer stats */}
          <div className="grid grid-cols-3 divide-x divide-zinc-800 border-t border-zinc-800 bg-zinc-950">
            <div className="px-4 py-3">
              <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Тикер</p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">MNK / РУБ</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Нач. цена</p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">0.1000&nbsp;Р</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Порог краха</p>
              <p className="text-xs font-mono text-red-800 mt-0.5">₽&nbsp;100&thinsp;000</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
