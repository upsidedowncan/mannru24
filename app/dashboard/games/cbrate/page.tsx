"use client";

import { useState, useEffect, useCallback } from "react";
import { GameLayout } from "@/components/GameLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { RiBankLine, RiArrowUpLine, RiArrowDownLine, RiSubtractLine, RiAlertLine } from "react-icons/ri";

interface Card {
  id: string;
  tier: string;
  number: string;
  balance: number;
}

interface HistoryPoint {
  quarter: string;
  rate: number;
}

interface CbState {
  currentRate: number;
  quarter: number;
  year: number;
  history: HistoryPoint[];
}

const OUTCOMES = [
  { id: "hold",   label: "Без изменений",  icon: RiSubtractLine,  color: "text-zinc-400",    bg: "bg-zinc-800",    payout: "×1.5" },
  { id: "up25",   label: "+0.25%",          icon: RiArrowUpLine,   color: "text-amber-400",   bg: "bg-amber-900/40", payout: "×2.5" },
  { id: "up50",   label: "+0.5%",           icon: RiArrowUpLine,   color: "text-orange-400",  bg: "bg-orange-900/40", payout: "×5" },
  { id: "down25", label: "-0.25%",          icon: RiArrowDownLine, color: "text-sky-400",     bg: "bg-sky-900/40",  payout: "×2.5" },
  { id: "down50", label: "-0.5%",           icon: RiArrowDownLine, color: "text-blue-400",    bg: "bg-blue-900/40", payout: "×5" },
  { id: "crisis", label: "Кризис 💀",       icon: RiAlertLine,     color: "text-red-400",     bg: "bg-red-900/40",  payout: "×12" },
] as const;

type OutcomeId = typeof OUTCOMES[number]["id"];

export default function CbRatePage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState("");
  const [bet, setBet] = useState("100");
  const [prediction, setPrediction] = useState<OutcomeId>("hold");
  const [cbState, setCbState] = useState<CbState | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    won: boolean;
    winnings: number;
    outcome: typeof OUTCOMES[number];
    flavorText: string;
    quarterLabel: string;
    newRate: number;
  } | null>(null);

  const balance = cards.find(c => c.id === selectedCard)?.balance ?? null;

  const fetchCards = useCallback(async () => {
    const res = await fetch("/api/cards");
    if (res.ok) {
      const data = await res.json();
      setCards(data.cards ?? []);
      if (!selectedCard && data.cards?.length) setSelectedCard(data.cards[0].id);
    }
  }, [selectedCard]);

  const fetchRate = useCallback(async () => {
    const res = await fetch("/api/games/cbrate");
    if (res.ok) setCbState(await res.json());
  }, []);

  useEffect(() => {
    fetchCards();
    fetchRate();
  }, [fetchCards, fetchRate]);

  async function placeBet() {
    const betNum = parseFloat(bet);
    if (!selectedCard || isNaN(betNum) || betNum <= 0) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/games/cbrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet: betNum, cardId: selectedCard, prediction }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return; }
      const outcomeObj = OUTCOMES.find(o => o.id === data.outcome.id) ?? OUTCOMES[0];
      setResult({
        won: data.won,
        winnings: data.winnings,
        outcome: outcomeObj,
        flavorText: data.flavorText,
        quarterLabel: data.quarterLabel,
        newRate: data.newRate,
      });
      setCbState(prev => prev ? { ...prev, currentRate: data.newRate, history: data.history } : prev);
      setCards(prev => prev.map(c => c.id === selectedCard ? { ...c, balance: data.newBalance } : c));
    } finally {
      setLoading(false);
    }
  }

  // Sparkline SVG from history
  function Sparkline({ history }: { history: HistoryPoint[] }) {
    if (history.length < 2) return null;
    const rates = history.map(h => h.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const range = max - min || 1;
    const w = 200, h = 40;
    const pts = rates.map((r, i) => {
      const x = (i / (rates.length - 1)) * w;
      const y = h - ((r - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    }).join(" ");
    const last = rates[rates.length - 1];
    const prev = rates[rates.length - 2];
    const color = last > prev ? "#f97316" : last < prev ? "#38bdf8" : "#71717a";
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" points={pts} />
        <circle cx={pts.split(" ").at(-1)?.split(",")[0]} cy={pts.split(" ").at(-1)?.split(",")[1]} r="2.5" fill={color} />
      </svg>
    );
  }

  return (
    <GameLayout
      title="Ставка ЦБ"
      description="Угадайте решение Банка Маннру по ключевой ставке"
      icon={<RiBankLine className="w-5 h-5" />}
      balance={balance}
      maxWidth="max-w-xl"
    >
      <div className="space-y-6 pb-6">
        {/* Current rate display */}
        {cbState && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 uppercase tracking-widest">Ключевая ставка</span>
              <span className="text-xs text-zinc-600">
                Q{cbState.quarter} {cbState.year}
              </span>
            </div>
            <div className="text-4xl font-bold tabular-nums tracking-tight">
              {cbState.currentRate.toFixed(2)}
              <span className="text-lg text-zinc-500 ml-1">%</span>
            </div>
            <Sparkline history={cbState.history} />
            <div className="flex gap-1 flex-wrap">
              {cbState.history.slice(-6).map((h, i) => (
                <span key={i} className="text-[10px] text-zinc-600">
                  {h.quarter}: {h.rate.toFixed(2)}%{i < Math.min(5, cbState.history.length - 1) ? " →" : ""}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Lobby */}
        <div className="max-w-sm mx-auto space-y-4">
          <div className="space-y-1.5">
            <Label>Карта</Label>
            <Select value={selectedCard} onValueChange={setSelectedCard}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Выберите карту" />
              </SelectTrigger>
              <SelectContent>
                {cards.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    •••• {c.number.slice(-4)} — {c.balance.toLocaleString("ru")} МР
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Ставка (МР)</Label>
            <Input
              type="number"
              min={1}
              value={bet}
              onChange={e => setBet(e.target.value)}
              className="h-11"
            />
          </div>

          {/* Prediction grid */}
          <div className="space-y-1.5">
            <Label>Ваш прогноз</Label>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map(o => {
                const Icon = o.icon;
                const active = prediction === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setPrediction(o.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                      active
                        ? `${o.bg} border-current ${o.color} font-semibold`
                        : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{o.label}</span>
                    <Badge variant="secondary" className="text-[10px] bg-zinc-900 border-zinc-700 shrink-0">
                      {o.payout}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            className="w-full h-11"
            onClick={placeBet}
            disabled={loading || !selectedCard}
          >
            {loading ? "Голосование совета..." : "Огласить решение"}
          </Button>
        </div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.quarterLabel}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className={`rounded-xl border p-4 space-y-3 ${
                result.won
                  ? "bg-emerald-950/40 border-emerald-800"
                  : "bg-red-950/40 border-red-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-semibold text-sm ${
                  result.won ? "text-emerald-400" : "text-red-400"
                }`}>
                  {result.won ? `+${result.winnings.toLocaleString("ru")} МР` : `Прогноз не верен`}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${
                    result.won ? "bg-emerald-900/60 text-emerald-300" : "bg-red-900/60 text-red-300"
                  }`}
                >
                  {result.quarterLabel} · {result.newRate.toFixed(2)}%
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed italic">
                &ldquo;{result.flavorText}&rdquo;
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}
