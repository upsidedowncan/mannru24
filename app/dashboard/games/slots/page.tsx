"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, useAnimation } from "framer-motion";
import { DiscIcon, UpdateIcon, ChevronLeftIcon } from "@radix-ui/react-icons";
import Link from "next/link";

const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "🔔", "💎", "7️⃣"];

export default function SlotsPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [bet, setBet] = useState(100);
  const [reels, setReels] = useState(["7️⃣", "7️⃣", "7️⃣"]);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cards")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCards(data);
          if (data.length > 0) setSelectedCardId(data[0].id);
        }
        setLoading(false);
      });
  }, []);

  const spin = async () => {
    if (spinning || !selectedCardId || bet <= 0) return;

    const card = cards.find(c => c.id === selectedCardId);
    if (card.balance < bet) {
      toast.error("Недостаточно средств на выбранной карте");
      return;
    }

    setSpinning(true);

    // Fake spin effect
    const spinInterval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
    }, 100);

    try {
      const res = await fetch("/api/games/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, cardId: selectedCardId }),
      });
      const data = await res.json();

      setTimeout(() => {
        clearInterval(spinInterval);
        if (res.ok) {
          setReels(data.result);
          if (data.winAmount > 0) {
            toast.success(data.winMessage, { description: `+${data.winAmount} МР` });
          } else {
            toast.error(data.winMessage);
          }
          // Update local card balance
          setCards(prev => prev.map(c => c.id === selectedCardId ? { ...c, balance: data.newBalance } : c));
        } else {
          toast.error(data.error);
        }
        setSpinning(false);
      }, 2000);
    } catch (e) {
      clearInterval(spinInterval);
      toast.error("Ошибка сети");
      setSpinning(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><UpdateIcon className="w-8 h-8 animate-spin" /></div>;

  const selectedCard = cards.find(c => c.id === selectedCardId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <Link href="/dashboard/games" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
        <ChevronLeftIcon /> К играм
      </Link>

      <Card className="bg-zinc-950 border-amber-900/50 shadow-2xl shadow-amber-500/5">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg mb-4">
            <DiscIcon className="w-8 h-8 text-white animate-spin-slow" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter uppercase italic">
            Слоты <span className="text-amber-500">777</span>
          </CardTitle>
          <CardDescription>
            Выигрыш до x50 от вашей ставки. Нам можно доверять.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Slot Reels */}
          <div className="flex justify-center gap-4 py-12 bg-zinc-900/50 rounded-3xl border border-zinc-800 inset-shadow-sm">
            {reels.map((symbol, i) => (
              <motion.div
                key={i}
                animate={spinning ? { y: [0, -20, 20, 0] } : {}}
                transition={{ repeat: Infinity, duration: 0.1 + i * 0.05 }}
                className="w-20 h-28 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center text-5xl shadow-xl"
              >
                {symbol}
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Выберите карту</label>
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full bg-zinc-900 border-zinc-800 rounded-lg p-3 text-sm"
              >
                {cards.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.tier} ••{c.number.slice(-4)} ({c.balance.toLocaleString()} МР)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Ставка (МР)</label>
              <Input
                type="number"
                value={bet}
                onChange={(e) => setBet(Number(e.target.value))}
                className="bg-zinc-900 border-zinc-800"
                min={1}
              />
            </div>
          </div>

          <Button
            onClick={spin}
            disabled={spinning || !selectedCardId || bet <= 0}
            className="w-full h-16 text-xl font-black uppercase tracking-tighter bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/20"
          >
            {spinning ? "КРУТИМ..." : "ДЁРНУТЬ РЫЧАГ"}
          </Button>

          {selectedCard && (
            <p className="text-center text-xs text-zinc-500">
              Баланс карты: <span className="text-zinc-300 font-bold">{selectedCard.balance.toLocaleString()} МР</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/30 border-zinc-900">
        <CardContent className="p-4">
          <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">Таблица выплат:</h4>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
            <div className="flex justify-between"><span>7️⃣ 7️⃣ 7️⃣</span> <span className="text-amber-500">x50</span></div>
            <div className="flex justify-between"><span>💎 💎 💎</span> <span className="text-amber-500">x20</span></div>
            <div className="flex justify-between"><span>🔔 🔔 🔔</span> <span className="text-amber-500">x10</span></div>
            <div className="flex justify-between"><span>Фрукты x3</span> <span className="text-amber-500">x5</span></div>
            <div className="flex justify-between"><span>Любые x2</span> <span className="text-amber-500">x1.5</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
