"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { GridIcon, UpdateIcon, ChevronLeftIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { CardSelect } from "@/components/CardSelect";

export default function TttPage() {
  const [selectedCardId, setSelectedCardId] = useState("");
  const [bet, setBet] = useState(200);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<"lobby" | "playing" | "won" | "lost" | "draw">("lobby");
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [balance, setBalance] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [gameToken, setGameToken] = useState<string | null>(null);

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
        if (data.newBalance !== undefined) setBalance(data.newBalance);
      } else {
        toast.error(data.error || "Ошибка старта");
      }
    } catch (e) {
      toast.error("Сетевая ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const makeMove = async (index: number) => {
    if (actionLoading || !gameToken || board[index] || gameState !== "playing") return;
    setActionLoading(true);

    // Optimistic update
    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);

    try {
      const res = await fetch("/api/games/ttt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move", token: gameToken, index }),
      });
      const data = await res.json();

      if (res.ok) {
        setBoard(data.board);
        if (data.outcome === "win") setGameState("won");
        else if (data.outcome === "loss") setGameState("lost");
        else if (data.outcome === "draw") setGameState("draw");
        else setGameToken(data.token);

        if (data.newBalance !== undefined) setBalance(data.newBalance);
      } else {
        toast.error(data.error || "Ошибка хода");
        // Revert on error
        const res2 = await fetch("/api/games/ttt/sync", {
           method: "POST",
           body: JSON.stringify({ token: gameToken })
        }).catch(() => null);
        if (res2?.ok) {
           const d = await res2.json();
           setBoard(d.board);
        }
      }
    } catch (e) {
      toast.error("Сетевая ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="space-y-6 px-4"><div className="h-8 w-32 bg-secondary rounded animate-pulse" /><div className="h-[400px] bg-secondary rounded-xl animate-pulse" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 md:px-0">
      <Link href="/dashboard/games" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
        <ChevronLeftIcon /> К играм
      </Link>

      <Card className="border-zinc-900 bg-zinc-950 overflow-hidden shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-blue-500 text-xl font-bold">
            <GridIcon className="w-6 h-6" /> КРЕСТИКИ-НОЛИКИ
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 uppercase tracking-widest">Победите ИИ Системы. Победа удваивает ставку.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pb-12">
          {gameState === "lobby" ? (
            <div className="w-full max-w-sm space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Ставка</label>
                  <Input type="number" value={bet} onChange={e => setBet(Number(e.target.value))} className="bg-zinc-900/50 border-zinc-800" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Карта</label>
                  <CardSelect value={selectedCardId} onValueChange={setSelectedCardId} className="bg-zinc-900/50 border-zinc-800" />
                </div>
              </div>
              <Button onClick={startGame} disabled={actionLoading} className="w-full h-11 text-sm font-bold shadow-[0_4px_12px_rgba(59,130,246,0.2)]" variant="gradient">
                {actionLoading ? <UpdateIcon className="animate-spin" /> : "НАЧАТЬ МАТЧ"}
              </Button>
            </div>
          ) : (
            <div className="space-y-10 w-full flex flex-col items-center">
              <div className="grid grid-cols-3 gap-3">
                {board.map((cell, i) => (
                  <button
                    key={i}
                    onClick={() => makeMove(i)}
                    disabled={!!cell || gameState !== "playing" || actionLoading}
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-xl border-2 transition-all flex items-center justify-center text-4xl font-black ${
                      cell === "X" ? "text-blue-500 border-blue-500/20 bg-blue-500/5" :
                      cell === "O" ? "text-red-500 border-red-500/20 bg-red-500/5" :
                      "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {cell && (
                        <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                          {cell}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                ))}
              </div>

              <div className="h-12 flex flex-col items-center justify-center">
                {gameState === "playing" ? (
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Ваш ход (X)</p>
                ) : (
                  <motion.div initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center gap-4">
                    <h3 className={`text-2xl font-black uppercase italic tracking-tighter ${
                      gameState === "won" ? "text-emerald-500" :
                      gameState === "lost" ? "text-red-600" : "text-zinc-400"
                    }`}>
                      {gameState === "won" ? "ПОБЕДА!" : gameState === "lost" ? "ПОРАЖЕНИЕ" : "НИЧЬЯ"}
                    </h3>
                    <Button onClick={() => setGameState("lobby")} variant="outline" size="sm" className="h-9 px-6 text-[10px] font-bold border-zinc-800 hover:bg-zinc-900">
                      В ЛОББИ
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
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
