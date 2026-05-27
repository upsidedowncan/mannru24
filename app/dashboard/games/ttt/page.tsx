"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { UpdateIcon, ChevronLeftIcon, GridIcon } from "@radix-ui/react-icons";
import Link from "next/link";

type Player = "X" | "O" | null;

export default function TicTacToePage() {
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [bet, setBet] = useState(200);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<"lobby" | "playing" | "won" | "lost" | "draw">("lobby");
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [actionLoading, setActionLoading] = useState(false);
  const [gameToken, setGameToken] = useState<string | null>(null);

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

  const startGame = async () => {
    if (!selectedCardId || bet <= 0) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/games/ttt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", bet, cardId: selectedCardId }),
      });
      const data = await res.json();
      if (res.ok) {
        setGameToken(data.token);
        setBoard(data.board);
        setGameState("playing");
        if (data.newBalance !== undefined) {
          setCards(prev => prev.map(c => c.id === selectedCardId ? { ...c, balance: data.newBalance } : c));
        }
      } else {
        toast.error(data.error || "Ошибка старта");
      }
    } catch (e) {
      toast.error("Сетевая ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMove = async (index: number) => {
    if (board[index] || gameState !== "playing" || actionLoading || !gameToken) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/games/ttt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move", token: gameToken, index }),
      });
      const data = await res.json();

      if (res.ok) {
        setBoard(data.board);
        if (data.outcome === "continue") {
          setGameToken(data.token);
        } else {
          setGameState(data.outcome);
          setGameToken(null);
          if (data.newBalance !== undefined) {
             setCards(prev => prev.map(c => c.id === selectedCardId ? { ...c, balance: data.newBalance } : c));
          }
          if (data.outcome === "win") toast.success("ПОБЕДА!");
          else if (data.outcome === "loss") toast.error("ВЫ ПРОИГРАЛИ");
          else toast.info("НИЧЬЯ");
        }
      } else {
        toast.error(data.error || "Ошибка хода");
      }
    } catch (e) {
      toast.error("Сетевая ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="space-y-6"><div className="h-8 w-32 bg-secondary rounded animate-pulse" /><div className="h-[400px] bg-secondary rounded-xl animate-pulse" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/games" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
        <ChevronLeftIcon /> К играм
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GridIcon className="w-5 h-5 text-blue-500" /> Крестики-Нолики
            </CardTitle>
            <CardDescription className="text-xs text-balance">Сразитесь с ИИ Системы. Победа удваивает ставку, ничья возвращает её.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {gameState === "lobby" ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">Ставка</label>
                    <Input type="number" value={bet} onChange={e => setBet(Number(e.target.value))} className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">Карта</label>
                    <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue placeholder="Карта" />
                      </SelectTrigger>
                      <SelectContent>
                        {cards.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.tier} ••{c.number.slice(-4)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={startGame} disabled={actionLoading} className="w-full h-12" variant="gradient">
                  {actionLoading ? <UpdateIcon className="animate-spin" /> : "Начать матч"}
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-3 gap-2 aspect-square max-w-[280px] mx-auto">
                  {board.map((cell, i) => (
                    <button
                      key={i}
                      onClick={() => handleMove(i)}
                      disabled={actionLoading || !!cell}
                      className="bg-secondary/30 border border-border rounded-xl flex items-center justify-center text-4xl font-bold transition-colors hover:bg-secondary/50 h-full"
                    >
                      <AnimatePresence mode="wait">
                        {cell === "X" && (
                          <motion.span key="X" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-blue-500">
                            X
                          </motion.span>
                        )}
                        {cell === "O" && (
                          <motion.span key="O" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-red-500">
                            O
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  ))}
                </div>

                <div className="text-center min-h-[80px] flex flex-col justify-center">
                   {gameState === "playing" ? (
                     <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                       {actionLoading ? "ИИ делает ход..." : "Ваш ход (X)"}
                     </p>
                   ) : (
                     <div className="space-y-3">
                        <h3 className={`text-2xl font-bold uppercase italic ${gameState === "won" ? "text-emerald-500" : gameState === "lost" ? "text-red-500" : "text-zinc-500"}`}>
                           {gameState === "won" ? "Победа!" : gameState === "lost" ? "Поражение" : "Ничья"}
                        </h3>
                        <Button onClick={() => setGameState("lobby")} variant="outline" size="sm">В лобби</Button>
                     </div>
                   )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
           <Card className="bg-secondary/10">
             <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Детали матча</CardTitle>
             </CardHeader>
             <CardContent className="text-xs space-y-2.5">
                <div className="flex justify-between"><span className="text-muted-foreground">Ставка:</span> <span>{bet} МР</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Награда за победу:</span> <span className="text-emerald-500">+{bet * 2} МР</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">При ничьей:</span> <span>+{bet} МР (возврат)</span></div>
             </CardContent>
           </Card>

           <div className="p-6 rounded-2xl bg-background border border-border text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Баланс карты</p>
              <p className="text-2xl font-bold">{cards.find(c => c.id === selectedCardId)?.balance.toLocaleString()} МР</p>
           </div>
        </div>
      </div>
    </div>
  );
}
