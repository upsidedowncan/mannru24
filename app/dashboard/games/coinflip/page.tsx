"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { RiRefreshLine, RiArrowLeftSLine, RiCoinLine } from "react-icons/ri";
import Link from "next/link";
import { CardSelect } from "@/components/CardSelect";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        if (Array.isArray(data)) {
          if (data.length > 0) setSelectedCardId(data[0].id);
        }
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
          if (data.win > 0) {
            toast.success(`Выигрыш: +${data.win} МР!`);
          } else {
            toast.error("Проигрыш");
          }
          if (data.newBalance !== undefined) setBalance(data.newBalance);
        }, 2000);
      } else {
        toast.error(data.error || "Ошибка");
        setFlipping(false);
      }
    } catch (e) {
      toast.error("Сетевая ошибка");
      setFlipping(false);
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
            <RiCoinLine className="w-5 h-5" /> Орёл или Решка
          </CardTitle>
          <CardDescription>Угадайте сторону и удвойте ставку</CardDescription>
        </CardHeader>
        <CardContent className="space-y-12 pb-12">
          <div className="flex justify-center py-8">
            <div className="relative w-32 h-32" style={{ perspective: '1000px' }}>
              <motion.div
                animate={flipping ? {
                  rotateY: [0, 1800],
                  y: [0, -150, 0]
                } : result === "tails" ? { rotateY: 180 } : { rotateY: 0 }}
                transition={flipping ? { duration: 2, ease: "easeInOut" } : { duration: 0.5 }}
                className="w-full h-full relative"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Heads */}
                <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border-4 border-yellow-700 flex items-center justify-center text-4xl font-bold text-yellow-900 shadow-xl" style={{ backfaceVisibility: 'hidden' }}>
                  О
                </div>
                {/* Tails */}
                <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border-4 border-yellow-700 flex items-center justify-center text-4xl font-bold text-yellow-900 shadow-xl" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  Р
                </div>
              </motion.div>
            </div>
          </div>

          <div className="max-w-sm mx-auto space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium">Ваш выбор</label>
                <Tabs value={choice} onValueChange={(v) => setChoice(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="heads">Орёл</TabsTrigger>
                        <TabsTrigger value="tails">Решка</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ставка</label>
                <Input type="number" value={bet} onChange={e => setBet(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Карта</label>
                <CardSelect value={selectedCardId} onValueChange={setSelectedCardId} />
              </div>
            </div>

            <Button
              onClick={flip}
              disabled={flipping}
              className="w-full h-12 font-bold"
              variant="gradient"
            >
              {flipping ? <RiRefreshLine className="animate-spin w-5 h-5" /> : "Подбросить"}
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
