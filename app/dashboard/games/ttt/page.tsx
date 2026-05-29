"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { RiGridLine, RiRefreshLine, RiArrowLeftSLine } from "react-icons/ri";
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
      <Link href="/dashboard/games" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
        <RiArrowLeftSLine /> К играм
      </Link>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <RiGridLine className="w-5 h-5" /> Крестики-нолики
          </CardTitle>
          <CardDescription>Победите ИИ Банка. Победа удваивает ставку.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pb-12">
          {gameState === "lobby" ? (
            <div className="w-full max-w-sm space-y-6 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ставка</label>
                  <Input type="number" value={bet} onChange={e => setBet(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Карта</label>
                  <CardSelect value={selectedCardId} onValueChange={setSelectedCardId} />
                </div>
              </div>
              <Button onClick={startGame} disabled={actionLoading} className="w-full" variant="gradient">
                {actionLoading ? <RiRefreshLine className="animate-spin" /> : "Начать матч"}
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
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-xl border-2 transition-all flex items-center justify-center text-4xl font-bold ${
                      cell === "X" ? "text-primary border-primary/20 bg-primary/5" :
                      cell === "O" ? "text-destructive border-destructive/20 bg-destructive/5" :
                      "border-secondary bg-secondary/50 hover:bg-secondary"
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
                  <p className="text-sm font-medium text-muted-foreground">Ваш ход (X)</p>
                ) : (
                  <motion.div initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center gap-4">
                    <h3 className={`text-2xl font-bold ${
                      gameState === "won" ? "text-emerald-500" :
                      gameState === "lost" ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {gameState === "won" ? "Победа!" : gameState === "lost" ? "Поражение" : "Ничья"}
                    </h3>
                    <Button onClick={() => setGameState("lobby")} variant="outline" size="sm">
                      В лобби
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
          <p className="text-sm text-muted-foreground">Текущий баланс: {balance.toLocaleString("ru")} МР</p>
        </div>
      )}
    </div>
  );
}
