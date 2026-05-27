"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { DiscIcon, UpdateIcon, ChevronLeftIcon, StarFilledIcon } from "@radix-ui/react-icons";
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
      toast.error("Недостаточно средств");
      return;
    }

    setSpinning(true);

    const spinInterval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
    }, 80);

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
          setCards(prev => prev.map(c => c.id === selectedCardId ? { ...c, balance: data.newBalance } : c));
        } else {
          toast.error(data.error);
        }
        setSpinning(false);
      }, 1500);
    } catch (e) {
      clearInterval(spinInterval);
      toast.error("Ошибка сети");
      setSpinning(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><UpdateIcon className="w-8 h-8 animate-spin" /></div>;

  const selectedCard = cards.find(c => c.id === selectedCardId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 relative">
      <div className="fixed inset-0 pointer-events-none opacity-20">
      </div>

      <Link href="/dashboard/games" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors relative z-10">
        <ChevronLeftIcon /> К играм
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-black border-amber-900/40 shadow-[0_0_50px_rgba(245,158,11,0.05)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
          <CardHeader className="text-center relative">
            <CardTitle className="text-5xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600">
              GOLD SLOTS
            </CardTitle>
            <CardDescription className="text-amber-900 font-bold tracking-[0.2em] uppercase text-[10px]">
              Premium Gambling Experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-10">
            {/* Slot Machine UI */}
            <div className="relative p-1 bg-gradient-to-b from-amber-900/50 to-zinc-900 rounded-[2rem]">
               <div className="flex justify-center gap-4 py-16 bg-zinc-950 rounded-[1.8rem] border-4 border-black shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
                {reels.map((symbol, i) => (
                  <div key={i} className="relative w-24 h-36 bg-gradient-to-b from-zinc-900 to-black rounded-xl border border-white/5 flex items-center justify-center text-6xl shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60 z-10" />
                    <motion.div
                      animate={spinning ? { y: [0, -300] } : { y: 0 }}
                      transition={spinning ? { repeat: Infinity, duration: 0.15, ease: "linear" } : { type: "spring", stiffness: 100 }}
                    >
                      {symbol}
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-amber-600/60 tracking-widest ml-1">Asset Source</label>
                <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                  <SelectTrigger className="h-12 bg-zinc-900/50 border-amber-900/20 text-zinc-300">
                    <SelectValue placeholder="Выберите карту" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-amber-900/30">
                    {cards.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-zinc-400">
                        {c.tier.toUpperCase()} • {c.balance.toLocaleString()} МР
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-amber-600/60 tracking-widest ml-1">Venture Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={bet}
                    onChange={(e) => setBet(Number(e.target.value))}
                    className="h-12 bg-zinc-900/50 border-amber-900/20 text-amber-500 font-bold pl-10"
                    min={1}
                  />
                  <StarFilledIcon className="absolute left-3 top-4 w-4 h-4 text-amber-600/40" />
                </div>
              </div>
            </div>

            <Button
              onClick={spin}
              disabled={spinning || !selectedCardId || bet <= 0}
              variant="gradient"
              className="w-full h-20 text-2xl font-black uppercase tracking-tighter bg-gradient-to-b from-amber-400 to-amber-700 hover:from-amber-300 hover:to-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.2)] rounded-2xl"
            >
              {spinning ? <UpdateIcon className="w-8 h-8 animate-spin" /> : "PULL THE LEVER"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-zinc-950 border-zinc-900 border-l-amber-900/50 border-l-4">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Yield Multipliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { sym: "7️⃣ 7️⃣ 7️⃣", mul: "x50", color: "text-amber-400" },
                  { sym: "💎 💎 💎", mul: "x20", color: "text-blue-400" },
                  { sym: "🔔 🔔 🔔", mul: "x10", color: "text-yellow-400" },
                  { sym: "ANY 3x MATCH", mul: "x5", color: "text-emerald-400" },
                  { sym: "ANY 2x MATCH", mul: "x1.5", color: "text-zinc-400" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-lg">{item.sym}</span>
                    <span className={`font-black ${item.color}`}>{item.mul}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-900/20 to-transparent border border-amber-900/20">
            <p className="text-[10px] uppercase font-bold text-amber-700 mb-2">Liquidity Status</p>
            <p className="text-3xl font-black text-white">{selectedCard?.balance.toLocaleString()} <span className="text-sm text-zinc-500">МР</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
