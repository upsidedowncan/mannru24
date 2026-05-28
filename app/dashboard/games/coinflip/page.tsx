"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon, UpdateIcon, DiscIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { CardSelect } from "@/components/CardSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CoinFlipPage() {
  const [selectedCardId, setSelectedCardId] = useState("");
  const [bet, setBet] = useState(100);
  const [side, setSide] = useState<"heads" | "tails">("heads");
  const [loading, setLoading] = useState(true);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/cards")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          if (data.length > 0 && !selectedCardId) setSelectedCardId(data[0].id);
        }
        setLoading(false);
      });
  }, []);

  const play = async () => {
    if (!selectedCardId || bet <= 0 || flipping) return;
    setFlipping(true);
    setResult(null);
    setWon(null);

    try {
      const res = await fetch("/api/games/coinflip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, cardId: selectedCardId, side }),
      });
      const data = await res.json();

      // Artificial delay for animation
      setTimeout(() => {
        if (res.ok) {
          setResult(data.result);
          setWon(data.won);
          setBalance(data.newBalance);
          if (data.won) {
            toast.success("ПОБЕДА!", {
              description: `Вы выиграли ${data.winnings} МР`,
              style: { background: '#064e3b', color: '#34d399', border: '1px solid #065f46' }
            });
          } else {
            toast.error("ПРОИГРЫШ", {
              style: { background: '#450a0a', color: '#f87171', border: '1px solid #7f1d1d' }
            });
          }
        } else {
          toast.error(data.error || "Ошибка");
        }
        setFlipping(false);
      }, 1500);
    } catch (e) {
      toast.error("Сетевая ошибка");
      setFlipping(false);
    }
  };

  if (loading) return <div className="space-y-6 px-4"><div className="h-8 w-32 bg-secondary rounded animate-pulse" /><div className="h-[400px] bg-secondary rounded-xl animate-pulse" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 md:px-0">
      <Link href="/dashboard/games" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
        <ChevronLeftIcon /> К играм
      </Link>

      <Card className="border-zinc-900 bg-zinc-950 overflow-hidden shadow-2xl relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-amber-500 text-xl font-bold italic">
            <DiscIcon className="w-6 h-6" /> ОРЕЛ ИЛИ РЕШКА
          </CardTitle>
          <CardDescription className="text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Шанс 50/50. Выигрыш 1.9x.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-12">
          {/* 3D Coin Animation */}
          <div className="relative w-40 h-40" style={{ perspective: '1000px' }}>
            <motion.div
              animate={flipping ? {
                rotateY: [0, 1800, 3600],
                y: [0, -100, 0]
              } : {
                rotateY: result === "tails" ? 180 : 0
              }}
              transition={{
                duration: flipping ? 1.5 : 0.6,
                ease: flipping ? "easeInOut" : "easeOut"
              }}
              className="w-full h-full relative transform-style-3d"
            >
              {/* Front (Heads) */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-amber-400 to-amber-700 rounded-full flex flex-col items-center justify-center border-4 border-amber-300 shadow-[inset_0_0_20px_rgba(0,0,0,0.5),0_0_30px_rgba(245,158,11,0.2)] backface-hidden">
                <div className="text-5xl mb-1">🦅</div>
                <div className="text-[8px] font-black uppercase text-amber-900/50 tracking-tighter">Mannru Republic</div>
              </div>
              {/* Back (Tails) */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-zinc-400 to-zinc-700 rounded-full flex flex-col items-center justify-center border-4 border-zinc-300 shadow-[inset_0_0_20px_rgba(0,0,0,0.5),0_0_30px_rgba(161,161,170,0.2)] backface-hidden [transform:rotateY(180deg)]">
                <div className="text-5xl mb-1">🪙</div>
                <div className="text-[8px] font-black uppercase text-zinc-900/50 tracking-tighter">Mannru Republic</div>
              </div>

              {/* Coin Edge */}
              <div className="absolute inset-0 rounded-full border-8 border-black/20 pointer-events-none" />
            </motion.div>

            {/* Shadow on the ground */}
            <motion.div
              animate={flipping ? { scale: [1, 0.5, 1], opacity: [0.2, 0.1, 0.2] } : { scale: 1, opacity: 0.2 }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full blur-md pointer-events-none"
            />
          </div>

          <div className="w-full max-w-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Ставка</label>
                <Input
                  type="number"
                  value={bet}
                  onChange={e => setBet(Number(e.target.value))}
                  className="bg-zinc-900/50 border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all h-11 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Карта</label>
                <CardSelect value={selectedCardId} onValueChange={setSelectedCardId} className="h-11 bg-zinc-900/50 border-zinc-800" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Ваш выбор</label>
              <Select value={side} onValueChange={(v: any) => setSide(v)}>
                <SelectTrigger className="h-11 bg-zinc-900/50 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800">
                  <SelectItem value="heads" className="focus:bg-zinc-900">🦅 Орел (Heads)</SelectItem>
                  <SelectItem value="tails" className="focus:bg-zinc-900">🪙 Решка (Tails)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={play}
              disabled={flipping}
              className="w-full h-14 text-sm font-black italic tracking-tighter transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_24px_rgba(245,158,11,0.2)] disabled:opacity-50"
              variant="gradient"
            >
              {flipping ? <UpdateIcon className="animate-spin w-5 h-5" /> : "ПОДБРОСИТЬ МОНЕТУ"}
            </Button>
          </div>

          <AnimatePresence>
            {result && !flipping && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <p className={`text-3xl font-black italic uppercase tracking-tighter ${won ? "text-emerald-500" : "text-red-600"}`}>
                  {won ? "ПОБЕДА!" : "ГЕЙМ ОВЕР"}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">Выпал {result === "heads" ? "Орел" : "Решка"}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {balance !== null && (
        <div className="text-center">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Текущий баланс: <span className="text-zinc-400">{balance.toLocaleString("ru")} МР</span></p>
        </div>
      )}
    </div>
  );
}
