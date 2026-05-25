"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Lock, ArrowUpRight, ArrowDownLeft, AlertTriangle } from "lucide-react";
import { useProgression } from "@/lib/progression";
import { useMarket, type Candle } from "@/lib/market";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(p: number): string {
  if (p < 1) return `₽${p.toFixed(4)}`;
  if (p < 1000) return `₽${p.toFixed(2)}`;
  if (p < 10000) return `₽${p.toFixed(1)}`;
  return `₽${Math.round(p).toLocaleString("ru")}`;
}

function fmtPct(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

// ─── Candlestick chart ────────────────────────────────────────────────────────

function CandlestickChart({
  candles,
  currentCandle,
  currentPrice,
}: {
  candles: Candle[];
  currentCandle: Partial<Candle>;
  currentPrice: number;
}) {
  const liveCandle: Candle | null =
    currentCandle.open !== undefined
      ? {
          time: Date.now(),
          open: currentCandle.open!,
          high: currentCandle.high!,
          low: currentCandle.low!,
          close: currentPrice,
        }
      : null;

  const all = [...candles.slice(-44), ...(liveCandle ? [liveCandle] : [])];

  if (all.length < 2) {
    return (
      <div className="w-full h-40 flex items-center justify-center text-zinc-700 text-xs font-mono">
        ЗАГРУЗКА ДАННЫХ РЫНКА...
      </div>
    );
  }

  const W = 700;
  const H = 220;
  const PR = 56; // right padding for price labels
  const PL = 4;
  const PT = 6;
  const PB = 14;

  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const allPrices = all.flatMap((c) => [c.high, c.low]);
  allPrices.push(currentPrice);
  const rawMin = Math.min(...allPrices);
  const rawMax = Math.max(...allPrices);
  const margin = (rawMax - rawMin) * 0.06 || rawMin * 0.02;
  const minP = rawMin - margin;
  const maxP = rawMax + margin;
  const range = maxP - minP || 1;

  const cSlot = chartW / all.length;
  const bodyW = Math.max(cSlot * 0.55, 1.5);

  const toX = (i: number) => PL + (i + 0.5) * cSlot;
  const toY = (p: number) => PT + chartH * (1 - (p - minP) / range);

  const ticks = 5;
  const tickStep = range / ticks;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-label="График MNK/RUB">
      {/* Horizontal grid */}
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const p = minP + tickStep * i;
        const y = toY(p);
        return (
          <g key={i}>
            <line
              x1={PL}
              y1={y}
              x2={W - PR}
              y2={y}
              stroke="#27272a"
              strokeWidth={0.5}
            />
            <text
              x={W - PR + 3}
              y={y + 3.5}
              fontSize="8"
              fill="#52525b"
              fontFamily="monospace"
            >
              {p < 1 ? p.toFixed(3) : p < 1000 ? p.toFixed(2) : p < 100000 ? p.toFixed(0) : Math.round(p).toLocaleString("ru")}
            </text>
          </g>
        );
      })}

      {/* Candles */}
      {all.map((c, i) => {
        const x = toX(i);
        const isGreen = c.close >= c.open;
        const col = isGreen ? "#22c55e" : "#ef4444";
        const bTop = toY(Math.max(c.open, c.close));
        const bBot = toY(Math.min(c.open, c.close));
        const bH = Math.max(bBot - bTop, 1);
        const isLast = i === all.length - 1 && liveCandle !== null;
        return (
          <g key={c.time}>
            <line
              x1={x}
              y1={toY(c.high)}
              x2={x}
              y2={toY(c.low)}
              stroke={col}
              strokeWidth={0.8}
              opacity={isLast ? 0.6 : 0.9}
            />
            <rect
              x={x - bodyW / 2}
              y={bTop}
              width={bodyW}
              height={bH}
              fill={col}
              fillOpacity={isLast ? 0.5 : 0.85}
            />
          </g>
        );
      })}

      {/* Current price marker */}
      {(() => {
        const y = toY(currentPrice);
        const label =
          currentPrice < 1
            ? currentPrice.toFixed(4)
            : currentPrice < 1000
            ? currentPrice.toFixed(2)
            : currentPrice < 100000
            ? currentPrice.toFixed(0)
            : Math.round(currentPrice).toLocaleString("ru");
        return (
          <g>
            <line
              x1={PL}
              y1={y}
              x2={W - PR}
              y2={y}
              stroke="#3b82f6"
              strokeWidth={0.8}
              strokeDasharray="3 2"
            />
            <rect
              x={W - PR + 2}
              y={y - 8}
              width={PR - 4}
              height={16}
              fill="#1e3a5f"
              rx={2}
            />
            <text
              x={W - PR + 2 + (PR - 4) / 2}
              y={y + 4}
              fontSize="8.5"
              fill="#60a5fa"
              textAnchor="middle"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {label}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

// ─── Crash overlay ────────────────────────────────────────────────────────────

function CrashOverlay({
  onDismiss,
  mnkLost,
}: {
  onDismiss: () => void;
  mnkLost: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-red-950/20 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 12 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-red-500/20"
            style={{ top: `${8 + i * 8}%`, left: 0, right: 0 }}
            animate={{ scaleX: [1, 1.02, 0.98, 1], opacity: [0.2, 0.5, 0.1, 0.3] }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        className="relative z-10 text-center space-y-6 px-6 max-w-md"
      >
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 0.8, repeat: 3, delay: 0.2 }}
          className="text-red-500 text-[10px] font-mono uppercase tracking-[0.4em]"
        >
          СИСТЕМА УНИЧТОЖЕНА
        </motion.div>

        <motion.h1
          animate={{ x: [0, -4, 4, -2, 2, 0] }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter leading-none"
          style={{ textShadow: "0 0 40px rgba(239,68,68,0.6)" }}
        >
          КРАХ<br />МАРКЕТА
        </motion.h1>

        <div className="text-zinc-400 text-sm font-mono space-y-1">
          <p>Курс MNK достиг ₽100,000</p>
          <p className="text-red-400">
            Сожжено: {mnkLost.toFixed(6)} MNK
          </p>
          <p>Рынок сброшен до ₽0.1</p>
        </div>

        <div className="border-t border-zinc-800 pt-4 space-y-1 text-[11px] text-zinc-600 font-mono">
          <p>MANNRU BANK EMERGENCY PROTOCOL v1.0</p>
          <p>MARKET_RESET — ALL MNK BALANCES WIPED</p>
        </div>

        <motion.button
          onClick={onDismiss}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 border border-red-800/60 text-red-400 text-xs font-mono uppercase tracking-widest hover:bg-red-950/30 transition-colors"
        >
          Принять участь
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface Card {
  id: string;
  tier: string;
  number: string;
  balance: number;
}

export default function InvestmentsPage() {
  const { level } = useProgression();
  const {
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
  } = useMarket();

  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [mnkInput, setMnkInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [trading, setTrading] = useState(false);

  const prevPriceRef = useRef(price);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (level < 15) return;
    fetch("/api/cards")
      .then((r) => r.json())
      .then((data: Card[]) => {
        setCards(data);
        if (data.length > 0) setSelectedCardId(data[0].id);
      })
      .catch(() => {});
  }, [level]);

  useEffect(() => {
    if (price === prevPriceRef.current) return;
    setFlash(price > prevPriceRef.current ? "up" : "down");
    prevPriceRef.current = price;
    const t = setTimeout(() => setFlash(null), 350);
    return () => clearTimeout(t);
  }, [price]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handleTrade = async () => {
    clearMessages();
    const amount = parseFloat(mnkInput.replace(",", "."));
    if (!amount || isNaN(amount) || amount <= 0) {
      setError("Введите корректное количество MNK");
      return;
    }

    setTrading(true);
    let result: { error?: string };

    if (tab === "buy") {
      if (!selectedCardId) {
        setError("Выберите карту");
        setTrading(false);
        return;
      }
      const card = cards.find((c) => c.id === selectedCardId);
      result = await buy(amount, selectedCardId, card?.balance ?? 0);
    } else {
      result = await sell(amount, selectedCardId || undefined);
    }

    setTrading(false);

    if (result.error) {
      setError(result.error);
    } else {
      const verb = tab === "buy" ? "Куплено" : "Продано";
      setSuccess(`${verb} ${amount.toFixed(6)} MNK`);
      setMnkInput("");
      // refresh card balances
      fetch("/api/cards")
        .then((r) => r.json())
        .then((data: Card[]) => setCards(data))
        .catch(() => {});
    }
  };

  // ── Locked state ──────────────────────────────────────────────────────────

  if (level < 15) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-blue-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tighter text-white uppercase">
            Инвестиционный Портал
          </h1>
          <p className="text-zinc-500 text-sm max-w-xs">
            Торговля Маннрублём. Рынок живёт, пампы случаются.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 border border-zinc-800 rounded text-xs text-zinc-500">
          <Lock className="w-3.5 h-3.5" />
          Требуется 15 уровень
        </div>
      </div>
    );
  }

  // ── Market view ───────────────────────────────────────────────────────────

  const pct = sessionOpen > 0 ? ((price - sessionOpen) / sessionOpen) * 100 : 0;
  const isUp = pct >= 0;

  const selectedCard = cards.find((c) => c.id === selectedCardId);
  const mnkInputNum = parseFloat(mnkInput.replace(",", ".")) || 0;
  const tradeCost = mnkInputNum * price;

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Crash overlay */}
      <AnimatePresence>
        {crashed && (
          <CrashOverlay
            onDismiss={dismissCrash}
            mnkLost={mnkAtCrash}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-zinc-500 text-[11px] font-mono uppercase tracking-widest mb-1">
            <span>MNK / RUB</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE</span>
          </div>
          <div className="flex items-baseline gap-3">
            <motion.span
              key={Math.round(price * 10000)}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className={`text-3xl sm:text-4xl font-black tracking-tighter font-mono transition-colors ${
                flash === "up"
                  ? "text-emerald-400"
                  : flash === "down"
                  ? "text-red-400"
                  : "text-white"
              }`}
            >
              {fmt(price)}
            </motion.span>
            <span
              className={`text-sm font-mono font-semibold flex items-center gap-1 ${
                isUp ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isUp ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownLeft className="w-3.5 h-3.5" />
              )}
              {fmtPct(pct)}
            </span>
          </div>
          <div className="text-zinc-600 text-[10px] font-mono mt-0.5">
            Маннрубль · тикер MNK · стартовая цена ₽0.1
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <div className="text-[10px] text-zinc-600 uppercase font-mono">Баланс MNK</div>
          <div className="text-lg font-bold text-white font-mono">
            {loadingBalance ? "—" : mnkBalance.toFixed(6)}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            ≈ {fmt(mnkBalance * price)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="border border-zinc-800 rounded overflow-hidden bg-zinc-950">
        <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Свечной график
          </span>
          <span className="text-[10px] font-mono text-zinc-600">
            {candles.length} свечей · 30 сек/свеча
          </span>
        </div>
        <div className="px-1 py-1">
          <CandlestickChart
            candles={candles}
            currentCandle={currentCandle}
            currentPrice={price}
          />
        </div>
      </div>

      {/* Trade + Portfolio row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Trade panel */}
        <div className="border border-zinc-800 rounded">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => { setTab("buy"); clearMessages(); }}
              className={`flex-1 py-2.5 text-xs font-mono uppercase tracking-widest transition-colors ${
                tab === "buy"
                  ? "text-emerald-400 border-b-2 border-emerald-500 -mb-px"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Купить MNK
            </button>
            <button
              onClick={() => { setTab("sell"); clearMessages(); }}
              className={`flex-1 py-2.5 text-xs font-mono uppercase tracking-widest transition-colors ${
                tab === "sell"
                  ? "text-red-400 border-b-2 border-red-500 -mb-px"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Продать MNK
            </button>
          </div>

          <div className="p-4 space-y-3">
            {tab === "buy" && (
              <div className="space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">
                  Карта оплаты
                </div>
                <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                  <SelectTrigger className="h-9 text-xs bg-zinc-900 border-zinc-700">
                    <SelectValue placeholder="Выберите карту" />
                  </SelectTrigger>
                  <SelectContent>
                    {cards.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        <span className="uppercase">{c.tier}</span>
                        {" "}••{c.number.slice(-4)}{" "}
                        <span className="text-zinc-400">
                          {c.balance.toLocaleString("ru", { minimumFractionDigits: 2 })} ₽
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {tab === "sell" && cards.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">
                  Зачислить на карту
                </div>
                <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                  <SelectTrigger className="h-9 text-xs bg-zinc-900 border-zinc-700">
                    <SelectValue placeholder="Первая доступная" />
                  </SelectTrigger>
                  <SelectContent>
                    {cards.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        <span className="uppercase">{c.tier}</span>
                        {" "}••{c.number.slice(-4)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">
                  Количество MNK
                </span>
                {tab === "sell" && mnkBalance > 0 && (
                  <button
                    onClick={() => setMnkInput(mnkBalance.toFixed(6))}
                    className="text-[10px] text-blue-400 font-mono hover:text-blue-300 transition-colors"
                  >
                    MAX {mnkBalance.toFixed(4)}
                  </button>
                )}
              </div>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.000000"
                value={mnkInput}
                onChange={(e) => { setMnkInput(e.target.value); clearMessages(); }}
                className="h-9 text-xs bg-zinc-900 border-zinc-700 font-mono"
              />
            </div>

            {mnkInputNum > 0 && (
              <div className="flex justify-between text-[11px] font-mono py-1 border-t border-zinc-800">
                <span className="text-zinc-500">
                  {tab === "buy" ? "Стоимость" : "Выручка"}
                </span>
                <span className={tab === "buy" ? "text-zinc-300" : "text-emerald-400"}>
                  {fmt(tradeCost)}
                </span>
              </div>
            )}

            {tab === "buy" && selectedCard && mnkInputNum > 0 && (
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-600">Остаток на карте</span>
                <span className={tradeCost > selectedCard.balance ? "text-red-400" : "text-zinc-400"}>
                  {fmt(Math.max(selectedCard.balance - tradeCost, 0))}
                </span>
              </div>
            )}

            {/* Feedback */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1.5 text-red-400 text-[11px] font-mono"
                >
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-emerald-400 text-[11px] font-mono"
                >
                  ✓ {success}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleTrade}
              disabled={trading || !mnkInput}
              className={`w-full py-2.5 text-xs font-mono uppercase tracking-widest border transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                tab === "buy"
                  ? "border-emerald-700 text-emerald-400 hover:bg-emerald-950/40 active:bg-emerald-950/60"
                  : "border-red-800 text-red-400 hover:bg-red-950/40 active:bg-red-950/60"
              }`}
            >
              {trading
                ? "ОБРАБОТКА..."
                : tab === "buy"
                ? `КУПИТЬ MNK · ${fmt(price)}`
                : `ПРОДАТЬ MNK · ${fmt(price)}`}
            </button>
          </div>
        </div>

        {/* Portfolio */}
        <div className="border border-zinc-800 rounded">
          <div className="px-4 py-2.5 border-b border-zinc-800">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Брокерский счёт
            </span>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <div className="text-[10px] text-zinc-600 font-mono mb-1">БАЛАНС MNK</div>
              <div className="text-2xl font-black font-mono text-white">
                {loadingBalance ? "—" : mnkBalance.toFixed(6)}
              </div>
              <div className="text-xs text-zinc-500 font-mono mt-0.5">
                ≈ {fmt(mnkBalance * price)}
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-3 space-y-2">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-600">Текущая цена</span>
                <span className="text-zinc-300">{fmt(price)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-600">Сессия</span>
                <span className={isUp ? "text-emerald-400" : "text-red-400"}>
                  {fmtPct(pct)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-600">Тикер</span>
                <span className="text-zinc-400">MNK / RUB</span>
              </div>
            </div>

            <div className="border border-zinc-800 rounded p-3 bg-zinc-900/40">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500/60 shrink-0 mt-0.5" />
                <p className="text-[10px] text-zinc-600 font-mono leading-relaxed">
                  При достижении ₽100,000 активируется аварийный протокол.
                  Все балансы MNK будут обнулены.
                </p>
              </div>
            </div>

            {/* Progress to crash */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-mono text-zinc-700">
                <span>₽{BASE_PRICE_DISPLAY}</span>
                <span>До краха: {fmt(100000 - price)}</span>
                <span>₽100,000</span>
              </div>
              <div className="h-0.5 bg-zinc-800 rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-red-500 transition-all duration-500"
                  style={{
                    width: `${Math.min((Math.log10(Math.max(price, 0.1)) / Math.log10(100000)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile MNK balance */}
      <div className="sm:hidden border border-zinc-800 rounded px-4 py-3 flex justify-between items-center">
        <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">MNK баланс</div>
        <div className="text-right">
          <div className="text-sm font-bold font-mono text-white">
            {loadingBalance ? "—" : mnkBalance.toFixed(6)}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">≈ {fmt(mnkBalance * price)}</div>
        </div>
      </div>
    </div>
  );
}

const BASE_PRICE_DISPLAY = "0.1";
