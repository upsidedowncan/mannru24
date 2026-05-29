"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { RiCrosshairLine, RiRefreshLine, RiArrowLeftSLine, RiUserLine, RiCloseLine } from "react-icons/ri";
import Link from "next/link";
import { CardSelect } from "@/components/CardSelect";

interface Participant {
  id: string;
  name: string;
  isBot: boolean;
  isDead: boolean;
}

export default function RoulettePage() {
  const [selectedCardId, setSelectedCardId] = useState("");
  const [bet, setBet] = useState(500);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<"lobby" | "playing" | "won" | "lost">("lobby");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [gameToken, setGameToken] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState("");

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
      const res = await fetch("/api/games/roulette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", bet, cardId: selectedCardId }),
      });
      const data = await res.json();
      if (res.ok) {
        setGameToken(data.token);
        setParticipants(data.state.participants);
        setTurnIndex(data.state.turnIndex);
        setGameState("playing");
        setLastMessage("Игра началась. Удачи.");
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

  const handleMove = async (move: "shoot" | "pass", targetId?: string) => {
    if (actionLoading || !gameToken) return;
    setActionLoading(true);

    try {
      const res = await fetch("/api/games/roulette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move", token: gameToken, move, targetId }),
      });
      const data = await res.json();

      if (res.ok) {
        setLastMessage(data.message);
        setParticipants(data.state.participants);
        setTurnIndex(data.state.turnIndex);

        if (data.status === "won") {
          setGameState("won");
          setGameToken(null);
          setBalance(data.newBalance);
          toast.success("ПОБЕДА!", { description: `Вы получили ${bet * 2} МР` });
        } else if (data.status === "lost") {
          setGameState("lost");
          setGameToken(null);
          setBalance(data.newBalance);
          toast.error("ВЫ ПРОИГРАЛИ");
        } else {
          setGameToken(data.token);
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

  useEffect(() => {
    if (gameState === "playing" && !actionLoading) {
      const current = participants[turnIndex];
      if (current && current.isBot && !current.isDead) {
        const timer = setTimeout(() => {
          handleMove("shoot");
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [turnIndex, gameState, participants, actionLoading]);

  if (loading) return <div className="space-y-6 px-4"><div className="h-8 w-32 bg-secondary rounded animate-pulse" /><div className="h-[400px] bg-secondary rounded-xl animate-pulse" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-0">
      <Link href="/dashboard/games" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
        <RiArrowLeftSLine /> К играм
      </Link>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <RiCrosshairLine className="w-5 h-5" /> Русская рулетка
          </CardTitle>
          <CardDescription>Выживите, чтобы забрать двойную ставку</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px] flex flex-col justify-center">
          {gameState === "lobby" ? (
            <div className="max-w-md mx-auto w-full space-y-6">
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
              <Button onClick={startGame} disabled={actionLoading} className="w-full h-11" variant="gradient">
                {actionLoading ? <RiRefreshLine className="animate-spin" /> : "Начать игру"}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {participants.map((p, i) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 ${
                      p.isDead
                        ? "bg-secondary/30 opacity-30 grayscale"
                        : turnIndex === i
                          ? "bg-primary/5 border-primary/30 scale-105 z-10"
                          : "bg-secondary/50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${p.isDead ? "bg-secondary" : "bg-secondary/50 border"}`}>
                      {p.isDead ? <RiCloseLine className="w-5 h-5 text-destructive" /> : <RiUserLine className="w-5 h-5" />}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold truncate w-24">{p.name}</p>
                      <p className={`text-[10px] font-medium mt-0.5 ${turnIndex === i && !p.isDead ? "text-primary" : "text-muted-foreground"}`}>
                        {p.isDead ? "ВЫБЫЛ" : turnIndex === i ? "ХОДИТ" : "ЖДЕТ"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="min-h-[160px] flex flex-col items-center justify-center space-y-6">
                <p className="text-muted-foreground text-sm italic text-center max-w-sm">"{lastMessage}"</p>

                <AnimatePresence mode="wait">
                  {gameState === "playing" && participants[turnIndex]?.id === "player" ? (
                    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="w-full max-w-lg space-y-4">
                      <div className="flex flex-col md:flex-row gap-2">
                        <Button onClick={() => handleMove("shoot", "player")} disabled={actionLoading} variant="destructive" className="flex-1 h-11">В себя</Button>
                        <div className="flex flex-1 gap-2">
                          {participants.filter(p => p.id !== "player" && !p.isDead).map(other => (
                            <Button key={other.id} onClick={() => handleMove("shoot", other.id)} disabled={actionLoading} className="flex-1 h-11" variant="outline">В {other.name.split('-')[1] || "бота"}</Button>
                          ))}
                          <Button onClick={() => handleMove("pass")} disabled={actionLoading} variant="secondary" className="flex-1 h-11">Пропуск</Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : gameState === "playing" ? (
                    <div className="flex flex-col items-center gap-2">
                      <RiRefreshLine className="w-5 h-5 animate-spin text-primary/50" />
                      <p className="text-xs text-muted-foreground">Ожидание хода...</p>
                    </div>
                  ) : null}

                  {(gameState === "won" || gameState === "lost") && (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
                      <h3 className={`text-3xl font-bold ${gameState === "won" ? "text-emerald-500" : "text-destructive"}`}>
                        {gameState === "won" ? "Победа!" : "Игра окончена"}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {gameState === "won" ? `+${bet * 2} МР начислено` : `-${bet} МР потеряно`}
                      </p>
                      <Button onClick={() => setGameState("lobby")} variant="outline" size="sm">
                        В лобби
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
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
