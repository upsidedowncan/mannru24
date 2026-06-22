"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { RiRefreshLine, RiCoinLine } from "react-icons/ri";
import { CardSelect } from "@/components/CardSelect";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameLayout } from "@/components/GameLayout";

export default function CoinFlipPage() {
  const [selectedCardId, setSelectedCardId] = useState("");
  const [bet, setBet] = useState(100);
  const [loading, setLoading] = useState(true);
  const [flipping, setFlipping] = useState(false);
  const [choice, setChoice] = useState<"heads" | "tails">("heads");
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/cards")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setSelectedCardId(data[0].id);
        setLoading(false);
      });
  }, []);

  const flip = async () => {
    if (!selectedCardId || bet <= 0 || flipping) return;
    setFlipping(true);
    setResult(null);
    try {
      const res = await fetch("/api/games/coinflip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, cardId: selectedCardId, choice }),
      });
      const data = await res.json();
      if (res.ok) {
        setTimeout(() => {
          setFlipping(false);
          setResult(data.result);
          if (data.win > 0) toast.success(`Выигрыш: +${data.win} МР!`);
          else toast.error("Проигрыш");
          if (data.newBalance !== undefined) setBalance(data.newBalance);
        }, 2000);
      } else {
        toast.error(data.error || "Ошибка");
        setFlipping(false);
      }
    } catch {
      toast.error("Сетевая ошибка");
      setFlipping(false);
    }
  };

  if (loading)
    return (
      <div className="space-y-6 px-4">
        <div className="h-5 w-24 bg-secondary rounded animate-pulse" />
        <div className="h-[420px] bg-secondary rounded-xl animate-pulse" />
      </div>
    );

  return (
    <GameLayout
      icon={<RiCoinLine className="w-5 h-5" />}
      title="Орёл или Решка"
      description="Угадайте сторону и удвойте ставку"
      balance={balance}
    >
      {/* Coin */}
      <div className="flex justify-center py-8">
        <div className="relative w-32 h-32" style={{ perspective: "1000px" }}>
          <motion.div
            animate={
              flipping
                ? { rotateY: [0, 1800], y: [0, -150, 0] }
                : result === "tails"
                ? { rotateY: 180 }
                : { rotateY: 0 }
            }
            transition={flipping ? { duration: 2, ease: "easeInOut" } : { duration: 0.5 }}
            className="w-full h-full relative"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border-4 border-yellow-700 flex flex-col items-center justify-center shadow-xl"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="text-2xl">🦅</span>
              <span className="text-[10px] font-bold text-yellow-900 uppercase tracking-widest mt-0.5">Орёл</span>
            </div>
            <div
              className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border-4 border-yellow-700 flex flex-col items-center justify-center shadow-xl"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <span className="text-2xl">🏛️</span>
              <span className="text-[10px] font-bold text-yellow-900 uppercase tracking-widest mt-0.5">Решка</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-sm mx-auto w-full space-y-4">
        <div className="space-y-1.5">
          <Label>Ваш выбор</Label>
          <Tabs value={choice} onValueChange={v => setChoice(v as "heads" | "tails")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="heads">Орёл</TabsTrigger>
              <TabsTrigger value="tails">Решка</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Ставка</Label>
            <Input type="number" value={bet} onChange={e => setBet(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Карта</Label>
            <CardSelect value={selectedCardId} onValueChange={setSelectedCardId} />
          </div>
        </div>

        <Button onClick={flip} disabled={flipping} className="w-full h-11 font-semibold" variant="gradient">
          {flipping ? <RiRefreshLine className="animate-spin w-4 h-4" /> : "Подбросить"}
        </Button>
      </div>
    </GameLayout>
  );
}
