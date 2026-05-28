"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon, UpdateIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { CardSelect } from "@/components/CardSelect";

export default function CoinFlipPage() {
  const [selectedCardId, setSelectedCardId] = useState("");
  const [bet, setBet] = useState(100);
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

  const play = async (side: "heads" | "tails") => {
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
            toast.success("Победа!", { description: `Вы выиграли ${data.winnings} МР` });
          } else {
            toast.error("Проигрыш");
          }
        } else {
          toast.error(data.error || "Ошибка");
        }
        setFlipping(false);
      }, 1000);
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

      <Card className="border-zinc-900 bg-zinc-950 overflow-hidden shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
        <CardHeader className="text-center">
          <CardTitle className="text-yellow-500 text-xl font-bold uppercase tracking-widest">
            Орел или Решка
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 uppercase tracking-widest">Шанс 50/50. Выигрыш 1.9x.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-10">
          <div className="relative w-32 h-32">
            <motion.div
              animate={flipping ? { rotateY: 1800 } : { rotateY: result === "tails" ? 180 : 0 }}
              transition={{ duration: flipping ? 1 : 0.5, ease: "easeOut" }}
              className="w-full h-full relative transform-style-3d"
            >
              <div className="absolute inset-0 w-full h-full bg-yellow-500 rounded-full flex items-center justify-center border-4 border-yellow-600 backface-hidden shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                <span className="text-4xl font-black text-yellow-900">🦅</span>
              </div>
              <div className="absolute inset-0 w-full h-full bg-zinc-700 rounded-full flex items-center justify-center border-4 border-zinc-600 backface-hidden [transform:rotateY(180deg)] shadow-[0_0_30px_rgba(63,63,70,0.3)]">
                <span className="text-4xl font-black text-zinc-400">🪙</span>
              </div>
            </motion.div>
          </div>

          <div className="w-full max-w-sm space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Ставка</label>
                <Input type="number" value={bet} onChange={e => setBet(Number(e.target.value))} className="bg-zinc-900/50 border-zinc-800" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Карта</label>
                <CardSelect value={selectedCardId} onValueChange={setSelectedCardId} className="bg-zinc-900/50 border-zinc-800" />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => play("heads")} disabled={flipping} className="flex-1 h-12 font-bold bg-yellow-600 hover:bg-yellow-700 text-white">
                ОРЕЛ
              </Button>
              <Button onClick={() => play("tails")} disabled={flipping} className="flex-1 h-12 font-bold bg-zinc-800 hover:bg-zinc-700 text-white">
                РЕШКА
              </Button>
            </div>
          </div>

          {result && !flipping && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <p className={`text-2xl font-black italic uppercase tracking-tighter ${won ? "text-emerald-500" : "text-red-600"}`}>
                {won ? "ПОБЕДА!" : "ПРОИГРЫШ"}
              </p>
              <p className="text-xs text-zinc-500 mt-1 uppercase font-bold tracking-widest">Выпал {result === "heads" ? "Орел" : "Решка"}</p>
            </motion.div>
          )}
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
