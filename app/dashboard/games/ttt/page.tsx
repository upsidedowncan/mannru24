"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { RiGridLine, RiRefreshLine } from "react-icons/ri";
import { CardSelect } from "@/components/CardSelect";
import { GameLayout } from "@/components/GameLayout";

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
        if (Array.isArray(data) && data.length > 0 && !selectedCardId) setSelectedCardId(data[0].id);
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
    } catch {
      toast.error("Сетевая ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const makeMove = async (index: number) => {
    if (actionLoading || !gameToken || board[index] || gameState !== "playing") return;
    setActionLoading(true);
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
        fetch("/api/games/ttt/sync", { method: "POST", body: JSON.stringify({ token: gameToken }) })
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d) setBoard(d.board); })
          .catch(() => null);
      }
    } catch {
      toast.error("Сетевая ошибка");
    } finally {
      setActionLoading(false);
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
      title="Крестики-нолики"
      description="Победите ИИ Банка. Победа удваивает ставку."
      icon={<RiGridLine className="w-5 h-5" />}
      balance={balance}
    >
      <div className="flex flex-col items-center justify-center pb-6">
        {gameState === "lobby" ? (
          <div className="w-full max-w-sm mx-auto space-y-4">
            <div className="space-y-2">
              <Label>Ставка</Label>
              <Input type="number" value={bet} onChange={e => setBet(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Карта</Label>
              <CardSelect value={selectedCardId} onValueChange={setSelectedCardId} />
            </div>
            <Button onClick={startGame} disabled={actionLoading} className="w-full h-11" variant="gradient">
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
                    cell === "X"
                      ? "text-primary border-primary/20 bg-primary/5"
                      : cell === "O"
                      ? "text-destructive border-destructive/20 bg-destructive/5"
                      : "border-secondary bg-secondary/50 hover:bg-secondary"
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
                    gameState === "won" ? "text-emerald-500" : gameState === "lost" ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {gameState === "won" ? "Победа!" : gameState === "lost" ? "Поражение" : "Ничья"}
                  </h3>
                  <Button onClick={() => setGameState("lobby")} variant="outline" size="sm">В лобби</Button>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
