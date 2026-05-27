"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { TargetIcon, UpdateIcon, ChevronLeftIcon, PersonIcon, Cross2Icon } from "@radix-ui/react-icons";
import Link from "next/link";

interface Participant {
  id: string;
  name: string;
  isBot: boolean;
  isDead: boolean;
}

export default function RoulettePage() {
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [bet, setBet] = useState(500);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<"lobby" | "playing" | "won" | "lost">("lobby");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [chamber, setChamber] = useState(0);
  const [log, setLog] = useState<string[]>([]);
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
        setChamber(data.state.chamber);
        setGameState("playing");
        setLog(["Игра началась. Кто-то сегодня не уйдет домой."]);
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

  const addLog = (msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 5));
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
        addLog(data.message);
        setParticipants(data.state.participants);
        setTurnIndex(data.state.turnIndex);
        setChamber(data.state.chamber);

        if (data.status === "won") {
          setGameState("won");
          setGameToken(null);
          setCards(prev => prev.map(c => c.id === selectedCardId ? { ...c, balance: data.newBalance } : c));
          toast.success("ПОБЕДА!", { description: `Вы получили ${bet * 2} МР` });
        } else if (data.status === "lost") {
          setGameState("lost");
          setGameToken(null);
          setCards(prev => prev.map(c => c.id === selectedCardId ? { ...c, balance: data.newBalance } : c));
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

  if (loading) return <div className="space-y-6"><div className="h-8 w-32 bg-secondary rounded animate-pulse" /><div className="h-[400px] bg-secondary rounded-xl animate-pulse" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/games" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
        <ChevronLeftIcon /> К играм
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <TargetIcon className="w-5 h-5" /> Русская Рулетка
            </CardTitle>
            <CardDescription className="text-xs">Выживите среди ботов, чтобы забрать двойную ставку</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[400px] flex flex-col justify-center">
            {gameState === "lobby" ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <TargetIcon className="w-8 h-8 text-red-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
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
                  {actionLoading ? <UpdateIcon className="animate-spin" /> : "Начать игру"}
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {participants.map((p, i) => (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border transition-all ${
                        p.isDead
                          ? "bg-secondary/50 border-transparent opacity-40 grayscale"
                          : turnIndex === i
                            ? "bg-red-500/10 border-red-500/50 shadow-sm"
                            : "bg-background border-border"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${p.isDead ? "bg-zinc-800" : "bg-secondary"}`}>
                          {p.isDead ? <Cross2Icon className="w-4 h-4 text-red-500" /> : <PersonIcon className="w-4 h-4" />}
                        </div>
                        <span className="text-[10px] font-bold truncate w-full text-center">{p.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="min-h-[120px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {gameState === "playing" && participants[turnIndex]?.id === "player" ? (
                      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="w-full space-y-4">
                        <p className="text-center text-[10px] font-bold uppercase text-red-500 tracking-wider">Ваш ход!</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Button onClick={() => handleMove("shoot", "player")} disabled={actionLoading} variant="destructive" className="h-11 font-bold">В СЕБЯ</Button>
                          <div className="flex gap-2">
                            {participants.filter(p => p.id !== "player" && !p.isDead).map(other => (
                              <Button key={other.id} onClick={() => handleMove("shoot", other.id)} disabled={actionLoading} className="flex-1 text-[10px]" variant="outline">В {other.name.split('-')[1] || "БОТА"}</Button>
                            ))}
                            <Button onClick={() => handleMove("pass")} disabled={actionLoading} variant="secondary" className="flex-1 text-[10px]">ПРОПУСК</Button>
                          </div>
                        </div>
                      </motion.div>
                    ) : gameState === "playing" ? (
                      <div className="flex flex-col items-center gap-3">
                        <UpdateIcon className="w-5 h-5 animate-spin text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Ход противника...</p>
                      </div>
                    ) : null}

                    {gameState === "won" && (
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
                        <h3 className="text-2xl font-bold text-emerald-500 uppercase italic">Вы победили!</h3>
                        <p className="text-muted-foreground text-xs">Приз зачислен на карту: +{bet * 2} МР</p>
                        <Button onClick={() => setGameState("lobby")} variant="outline" size="sm">Еще раз</Button>
                      </motion.div>
                    )}

                    {gameState === "lost" && (
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
                        <h3 className="text-2xl font-bold text-red-500 uppercase italic">Вы выбыли</h3>
                        <p className="text-muted-foreground text-xs">Ставка потеряна: -{bet} МР</p>
                        <Button onClick={() => setGameState("lobby")} variant="outline" size="sm">Попробовать снова</Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardHeader>
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">История событий</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {log.map((msg, i) => (
                <div key={i} className={`text-[10px] border-l-2 pl-3 py-0.5 ${i === 0 ? "border-red-500 font-medium" : "border-zinc-800 text-muted-foreground"}`}>
                  {msg}
                </div>
              ))}
              {log.length === 0 && <p className="text-[10px] text-muted-foreground italic text-center py-10">Ожидание матча...</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
