"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { TargetIcon, UpdateIcon, ChevronLeftIcon, PersonIcon, Cross2Icon } from "@radix-ui/react-icons";
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
        setLastMessage("Игра началась. Кто-то сегодня не уйдет домой.");
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
      <Link href="/dashboard/games" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
        <ChevronLeftIcon /> К играм
      </Link>

      <Card className="border-zinc-900 bg-zinc-950 overflow-hidden shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-red-500 text-xl font-bold">
            <TargetIcon className="w-6 h-6" /> РУССКАЯ РУЛЕТКА
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 uppercase tracking-widest">Выживите среди ботов, чтобы забрать двойную ставку</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px] flex flex-col justify-center">
          {gameState === "lobby" ? (
            <div className="max-w-md mx-auto w-full space-y-6">
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
              <Button onClick={startGame} disabled={actionLoading} className="w-full h-11 text-sm font-bold shadow-[0_4px_12px_rgba(239,68,68,0.2)]" variant="gradient">
                {actionLoading ? <UpdateIcon className="animate-spin" /> : "НАЧАТЬ ИГРУ"}
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
                        ? "bg-zinc-900/30 border-zinc-900 opacity-30 grayscale"
                        : turnIndex === i
                          ? "bg-red-500/5 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)] scale-105 z-10"
                          : "bg-zinc-900/50 border-zinc-800"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${p.isDead ? "bg-zinc-800" : "bg-zinc-800/50 border border-zinc-700"}`}>
                      {p.isDead ? <Cross2Icon className="w-5 h-5 text-red-500" /> : <PersonIcon className="w-5 h-5 text-zinc-400" />}
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-tighter text-zinc-300 truncate w-24">{p.name}</p>
                      <p className={`text-[8px] font-bold uppercase mt-0.5 ${turnIndex === i && !p.isDead ? "text-red-500" : "text-zinc-600"}`}>
                        {p.isDead ? "ВЫБЫЛ" : turnIndex === i ? "ХОДИТ" : "ЖДЕТ"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="min-h-[160px] flex flex-col items-center justify-center space-y-6">
                <p className="text-zinc-400 text-sm italic text-center max-w-sm">"{lastMessage}"</p>

                <AnimatePresence mode="wait">
                  {gameState === "playing" && participants[turnIndex]?.id === "player" ? (
                    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="w-full max-w-lg space-y-4">
                      <div className="flex flex-col md:flex-row gap-2">
                        <Button onClick={() => handleMove("shoot", "player")} disabled={actionLoading} variant="destructive" className="flex-1 h-11 font-bold text-xs">В СЕБЯ</Button>
                        <div className="flex flex-1 gap-2">
                          {participants.filter(p => p.id !== "player" && !p.isDead).map(other => (
                            <Button key={other.id} onClick={() => handleMove("shoot", other.id)} disabled={actionLoading} className="flex-1 text-[10px] h-11" variant="outline">В {other.name.split('-')[1] || "БОТА"}</Button>
                          ))}
                          <Button onClick={() => handleMove("pass")} disabled={actionLoading} variant="secondary" className="flex-1 text-[10px] h-11">ПРОПУСК</Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : gameState === "playing" ? (
                    <div className="flex flex-col items-center gap-2">
                      <UpdateIcon className="w-5 h-5 animate-spin text-red-500/50" />
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Ожидание...</p>
                    </div>
                  ) : null}

                  {(gameState === "won" || gameState === "lost") && (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
                      <h3 className={`text-3xl font-black uppercase italic tracking-tighter ${gameState === "won" ? "text-emerald-500" : "text-red-600"}`}>
                        {gameState === "won" ? "ПОБЕДА" : "ГЕЙМ ОВЕР"}
                      </h3>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                        {gameState === "won" ? `+${bet * 2} МР НАЧИСЛЕНО` : `-${bet} МР ПОТЕРЯНО`}
                      </p>
                      <Button onClick={() => setGameState("lobby")} variant="outline" size="sm" className="h-9 px-6 text-[10px] font-bold border-zinc-800 hover:bg-zinc-900">
                        В ЛОББИ
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
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Текущий баланс: <span className="text-zinc-400">{balance.toLocaleString("ru")} МР</span></p>
        </div>
      )}
    </div>
  );
}
