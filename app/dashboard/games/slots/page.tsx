"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { SewingPinFilledIcon, UpdateIcon, ChevronLeftIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { CardSelect } from "@/components/CardSelect";

const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "🔔", "💎", "7️⃣"];

export default function SlotsPage() {
  const [selectedCardId, setSelectedCardId] = useState("");
  const [bet, setBet] = useState(100);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([0, 0, 0]);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/cards")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          if (data.length > 0) setSelectedCardId(data[0].id);
        }
        setLoading(false);
      });
  }, []);

  const spin = async () => {
    if (!selectedCardId || bet <= 0 || spinning) return;
    setSpinning(true);

    try {
      const res = await fetch("/api/games/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, cardId: selectedCardId }),
      });
      const data = await res.json();

      if (res.ok) {
        // Start animation
        setReels(data.reels);
        if (data.newBalance !== undefined) setBalance(data.newBalance);

        setTimeout(() => {
          setSpinning(false);
          if (data.win > 0) {
            toast.success(`ВЫИГРЫШ: +${data.win} МР!`, {
                style: { background: '#064e3b', color: '#34d399', border: '1px solid #065f46' }
            });
          }
        }, 3000);
      } else {
        toast.error(data.error || "Ошибка");
        setSpinning(false);
      }
    } catch (e) {
      toast.error("Сетевая ошибка");
      setSpinning(false);
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
            <SewingPinFilledIcon className="w-6 h-6 rotate-180" /> СЛОТ-МАШИНА
          </CardTitle>
          <CardDescription className="text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Три в ряд — джекпот. Две — возврат.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-12 pb-12">
          {/* 3D Vertical Reels */}
          <div className="flex justify-center gap-4 py-8">
            {[0, 1, 2].map((i) => (
              <SlotReel key={i} targetIndex={reels[i]} spinning={spinning} delay={i * 0.2} />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-sm mx-auto">
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

          <div className="flex justify-center">
            <Button
              onClick={spin}
              disabled={spinning}
              className="w-full max-w-xs h-14 text-sm font-black italic tracking-tighter transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_24px_rgba(245,158,11,0.2)] disabled:opacity-50"
              variant="gradient"
            >
              {spinning ? <UpdateIcon className="animate-spin w-5 h-5" /> : "ДЕРНУТЬ РЫЧАГ"}
            </Button>
          </div>
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

function SlotReel({ targetIndex, spinning, delay }: { targetIndex: number, spinning: boolean, delay: number }) {
  const controls = useAnimation();

  useEffect(() => {
    if (spinning) {
      // Extended spinning animation for 3D effect
      controls.start({
        rotateX: [0, -360 * 5 - (targetIndex * (360 / SYMBOLS.length))],
        transition: {
          duration: 2.5,
          delay,
          ease: [0.45, 0.05, 0.55, 0.95]
        }
      });
    } else {
        // Reset or maintain position
        controls.set({ rotateX: -(targetIndex * (360 / SYMBOLS.length)) });
    }
  }, [spinning, targetIndex, controls, delay]);

  const radius = 90; // Cylinder radius

  return (
    <div className="w-20 h-32 md:w-24 md:h-40 bg-zinc-900 rounded-xl relative overflow-hidden border border-zinc-800 shadow-inner flex items-center justify-center" style={{ perspective: '1000px' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10 opacity-60 pointer-events-none" />
      <div className="absolute inset-x-0 h-[2px] bg-amber-500/20 top-1/2 -translate-y-1/2 z-20" />

      <motion.div
        animate={controls}
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {SYMBOLS.map((symbol, idx) => {
          const angle = (360 / SYMBOLS.length) * idx;
          return (
            <div
              key={idx}
              className="absolute inset-0 flex items-center justify-center text-3xl md:text-4xl backface-hidden"
              style={{
                transform: `rotateX(${angle}deg) translateZ(${radius}px)`,
                backfaceVisibility: 'hidden'
              }}
            >
              {symbol}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
