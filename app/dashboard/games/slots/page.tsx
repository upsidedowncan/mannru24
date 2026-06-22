"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, useAnimation } from "framer-motion";
import { RiRefreshLine } from "react-icons/ri";
import { CardSelect } from "@/components/CardSelect";
import { GameLayout } from "@/components/GameLayout";

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
        if (Array.isArray(data) && data.length > 0) setSelectedCardId(data[0].id);
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
          if (data.win > 0) toast.success(`Выигрыш: +${data.win} МР!`);
        }, 3000);
      } else {
        toast.error(data.error || "Ошибка");
        setSpinning(false);
      }
    } catch {
      toast.error("Сетевая ошибка");
      setSpinning(false);
    }
  };

  if (loading)
    return (
      <div className="space-y-6 px-4">
        <div className="h-8 w-32 bg-secondary rounded animate-pulse" />
        <div className="h-[400px] bg-secondary rounded-xl animate-pulse" />
      </div>
    );

  return (
    <GameLayout
      title="Слот-машина"
      description="Три в ряд — джекпот. Две — возврат."
      icon={<RiRefreshLine className="w-5 h-5 rotate-180" />}
      balance={balance}
    >
      <div className="space-y-8 pb-6">
        <div className="flex justify-center gap-4 py-8">
          {[0, 1, 2].map(i => (
            <SlotReel key={i} targetIndex={reels[i]} spinning={spinning} delay={i * 0.2} />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="space-y-2">
            <Label>Ставка</Label>
            <Input type="number" value={bet} onChange={e => setBet(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Карта</Label>
            <CardSelect value={selectedCardId} onValueChange={setSelectedCardId} />
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={spin}
            disabled={spinning}
            className="w-full max-w-xs h-11 font-bold"
            variant="gradient"
          >
            {spinning ? <RiRefreshLine className="animate-spin w-5 h-5" /> : "Дёрнуть рычаг"}
          </Button>
        </div>
      </div>
    </GameLayout>
  );
}

function SlotReel({ targetIndex, spinning, delay }: { targetIndex: number; spinning: boolean; delay: number }) {
  const controls = useAnimation();

  useEffect(() => {
    if (spinning) {
      controls.start({
        rotateX: [0, -360 * 5 - targetIndex * (360 / SYMBOLS.length)],
        transition: { duration: 2.5, delay, ease: [0.45, 0.05, 0.55, 0.95] },
      });
    } else {
      controls.set({ rotateX: -(targetIndex * (360 / SYMBOLS.length)) });
    }
  }, [spinning, targetIndex, controls, delay]);

  return (
    <div
      className="w-20 h-32 md:w-24 md:h-40 bg-secondary rounded-xl relative overflow-hidden border shadow-inner flex items-center justify-center"
      style={{ perspective: "1000px" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10 opacity-60 pointer-events-none" />
      <motion.div animate={controls} className="relative w-full h-full" style={{ transformStyle: "preserve-3d" }}>
        {SYMBOLS.map((symbol, idx) => (
          <div
            key={idx}
            className="absolute inset-0 flex items-center justify-center text-3xl md:text-4xl"
            style={{
              transform: `rotateX(${(360 / SYMBOLS.length) * idx}deg) translateZ(90px)`,
              backfaceVisibility: "hidden",
            }}
          >
            {symbol}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
