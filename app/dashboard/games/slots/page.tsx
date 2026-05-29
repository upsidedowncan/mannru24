"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { RiRefreshLine, RiArrowLeftSLine, RiInformationLine } from "react-icons/ri";
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
        setReels(data.reels);
        if (data.newBalance !== undefined) setBalance(data.newBalance);

        setTimeout(() => {
          setSpinning(false);
          if (data.win > 0) {
            toast.success(`Выигрыш: +${data.win} МР!`);
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
      <Link href="/dashboard/games" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
        <RiArrowLeftSLine /> К играм
      </Link>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <RiRefreshLine className="w-5 h-5 rotate-180" /> Слот-машина
          </CardTitle>
          <CardDescription>Три в ряд — джекпот. Две — возврат.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-12 pb-12">
          <div className="flex justify-center gap-4 py-8">
            {[0, 1, 2].map((i) => (
              <SlotReel key={i} targetIndex={reels[i]} spinning={spinning} delay={i * 0.2} />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ставка</label>
              <Input
                type="number"
                value={bet}
                onChange={e => setBet(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Карта</label>
              <CardSelect value={selectedCardId} onValueChange={setSelectedCardId} />
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={spin}
              disabled={spinning}
              className="w-full max-w-xs h-12 font-bold"
              variant="gradient"
            >
              {spinning ? <RiRefreshLine className="animate-spin w-5 h-5" /> : "Дёрнуть рычаг"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {balance !== null && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Текущий баланс: {balance.toLocaleString("ru")} МР</p>
        </div>
      )}
    </div>
  );
}

function SlotReel({ targetIndex, spinning, delay }: { targetIndex: number, spinning: boolean, delay: number }) {
  const controls = useAnimation();

  useEffect(() => {
    if (spinning) {
      controls.start({
        rotateX: [0, -360 * 5 - (targetIndex * (360 / SYMBOLS.length))],
        transition: {
          duration: 2.5,
          delay,
          ease: [0.45, 0.05, 0.55, 0.95]
        }
      });
    } else {
        controls.set({ rotateX: -(targetIndex * (360 / SYMBOLS.length)) });
    }
  }, [spinning, targetIndex, controls, delay]);

  const radius = 90;

  return (
    <div className="w-20 h-32 md:w-24 md:h-40 bg-secondary rounded-xl relative overflow-hidden border shadow-inner flex items-center justify-center" style={{ perspective: '1000px' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10 opacity-60 pointer-events-none" />

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
