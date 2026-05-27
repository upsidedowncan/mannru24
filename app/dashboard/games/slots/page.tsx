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

  if (loading) return <div className="space-y-6"><div className="h-8 w-32 bg-secondary rounded animate-pulse" /><div className="h-[400px] bg-secondary rounded-xl animate-pulse" /></div>;

  const selectedCard = cards.find(c => c.id === selectedCardId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard/games" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
        <ChevronLeftIcon /> К играм
      </Link>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
            <DiscIcon className={`w-6 h-6 text-amber-500 ${spinning ? 'animate-spin' : ''}`} />
          </div>
          <CardTitle>Слоты 777</CardTitle>
          <CardDescription>Выигрыш до x50 от вашей ставки</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex justify-center gap-4 py-8 bg-secondary/30 rounded-2xl border">
            {reels.map((symbol, i) => (
              <motion.div
                key={i}
                animate={spinning ? { y: [0, -10, 10, 0] } : {}}
                className="w-16 h-24 bg-background rounded-lg border flex items-center justify-center text-4xl shadow-sm"
              >
                {symbol}
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">Карта</label>
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Выберите карту" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.tier} • {c.balance.toLocaleString()} МР
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">Ставка</label>
              <Input
                type="number"
                value={bet}
                onChange={(e) => setBet(Number(e.target.value))}
                className="bg-secondary/50"
              />
            </div>
          </div>

          <Button
            onClick={spin}
            disabled={spinning || !selectedCardId || bet <= 0}
            className="w-full h-12 text-lg font-bold"
            variant="gradient"
          >
            {spinning ? <UpdateIcon className="animate-spin" /> : "Крутить"}
          </Button>

          {selectedCard && (
            <p className="text-center text-[10px] text-muted-foreground">
              Доступно: <span className="text-foreground font-semibold">{selectedCard.balance.toLocaleString()} МР</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-accent/30">
        <CardContent className="pt-4">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-3">Таблица выплат:</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between border-b border-white/5 pb-1"><span>7️⃣ 7️⃣ 7️⃣</span> <span className="text-amber-500 font-bold">x50</span></div>
            <div className="flex justify-between border-b border-white/5 pb-1"><span>💎 💎 💎</span> <span className="text-blue-500 font-bold">x20</span></div>
            <div className="flex justify-between border-b border-white/5 pb-1"><span>🔔 🔔 🔔</span> <span className="text-yellow-500 font-bold">x10</span></div>
            <div className="flex justify-between border-b border-white/5 pb-1"><span>3 одинаковых</span> <span className="text-emerald-500 font-bold">x5</span></div>
            <div className="flex justify-between border-b border-white/5 pb-1"><span>2 одинаковых</span> <span className="text-zinc-400 font-bold">x1.5</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
