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
          toast.success("ПОБЕДА!", { description: `Вы получили ${bet} МР` });
        } else if (data.status === "lost") {
          setGameState("lost");
          setGameToken(null);
          setCards(prev => prev.map(c => c.id === selectedCardId ? { ...c, balance: data.newBalance } : c));
          toast.error("ВЫ ПРОИГРАЛИ", { description: `Вы потеряли ${bet} МР` });
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

  // Bot logic
  useEffect(() => {
    if (gameState === "playing" && !actionLoading) {
      const current = participants[turnIndex];
      if (current && current.isBot && !current.isDead) {
        const timer = setTimeout(() => {
          handleMove("shoot"); // Target choice and action type will be decided by server for bots
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [turnIndex, gameState, participants, actionLoading]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><UpdateIcon className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <Link href="/dashboard/games" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
        <ChevronLeftIcon /> К играм
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Area */}
        <Card className="lg:col-span-2 bg-zinc-950 border-red-900/50 relative overflow-hidden">
          {gameState === "playing" && (
            <div className="absolute top-4 right-4 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 text-[10px] font-bold text-red-500 animate-pulse">
              LIVE MATCH
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500 uppercase italic font-black tracking-tighter">
              <TargetIcon className="w-6 h-6" /> Русская Рулетка
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 min-h-[400px] flex flex-col justify-center">
            {gameState === "lobby" ? (
              <div className="space-y-6 text-center">
                <div className="p-8 bg-zinc-900/50 rounded-full w-32 h-32 mx-auto flex items-center justify-center border border-zinc-800">
                  <TargetIcon className="w-16 h-16 text-zinc-700" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Плата / Ставка</label>
                    <Input type="number" value={bet} onChange={e => setBet(Number(e.target.value))} className="bg-zinc-900" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Карта для списания</label>
                    <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                      <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                        <SelectValue placeholder="Выберите карту" />
                      </SelectTrigger>
                      <SelectContent>
                        {cards.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.tier} ••{c.number.slice(-4)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={startGame} disabled={actionLoading} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold text-lg">
                  {actionLoading ? <UpdateIcon className="animate-spin" /> : "ВСТУПИТЬ В ИГРУ"}
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Participants List */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {participants.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        p.isDead
                          ? "bg-zinc-900 border-zinc-800 opacity-50 grayscale"
                          : turnIndex === i
                            ? "bg-red-950/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                            : "bg-zinc-900/50 border-zinc-800"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${p.isDead ? "bg-zinc-800" : "bg-zinc-800"}`}>
                          {p.isDead ? <Cross2Icon className="text-red-500" /> : <PersonIcon />}
                        </div>
                        <span className="text-xs font-bold truncate w-full text-center">{p.name}</span>
                        {p.isDead && <span className="text-[10px] text-red-500 font-black uppercase tracking-tighter">ВЫБЫЛ</span>}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Controls for player */}
                <AnimatePresence>
                  {gameState === "playing" && participants[turnIndex]?.id === "player" && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="text-center text-sm font-medium mb-2 text-zinc-400">Ваш ход! Что будете делать? {chamber > 0 && `(В барабане +${chamber})`}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Button
                            onClick={() => handleMove("shoot", "player")}
                            disabled={actionLoading}
                            variant="destructive"
                            className="w-full h-14 font-black uppercase tracking-tight"
                          >
                            В СЕБЯ
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          {participants.filter(p => p.id !== "player" && !p.isDead).map(other => (
                            <Button
                              key={other.id}
                              onClick={() => handleMove("shoot", other.id)}
                              disabled={actionLoading}
                              className="flex-1 h-14 bg-zinc-800 hover:bg-zinc-700 text-[10px]"
                            >
                              В {other.name.split('-')[1] || other.name}
                            </Button>
                          ))}
                          <Button
                             onClick={() => handleMove("pass")}
                             disabled={actionLoading}
                             variant="outline"
                             className="flex-1 h-14 border-zinc-800"
                          >
                            ПРОПУСК
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* End Game Screens */}
                {gameState === "won" && (
                   <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-center space-y-4">
                      <div className="text-6xl mb-4">🏆</div>
                      <h2 className="text-3xl font-black text-emerald-500 uppercase">ВЫ ВЫЖИЛИ!</h2>
                      <p className="text-zinc-400">Все противники выбыли. Ваш куш: {bet * 2} МР</p>
                      <Button onClick={() => setGameState("lobby")} variant="outline" className="mt-4 border-zinc-800">ЕЩЕ РАЗ?</Button>
                   </motion.div>
                )}
                {gameState === "lost" && (
                   <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-center space-y-4">
                      <div className="text-6xl mb-4">💀</div>
                      <h2 className="text-3xl font-black text-red-600 uppercase">ВАС ПРИСТРЕЛИЛИ</h2>
                      <p className="text-zinc-400">С карты списано {bet} МР за уборку помещения.</p>
                      <Button onClick={() => setGameState("lobby")} variant="outline" className="mt-4 border-zinc-800">ПОПРОБОВАТЬ СНОВА</Button>
                   </motion.div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log Area */}
        <Card className="bg-zinc-950 border-zinc-900">
          <CardHeader>
             <CardTitle className="text-sm font-bold uppercase text-zinc-500 tracking-widest">Протокол событий</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {log.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className={`text-xs border-l-2 pl-3 py-1 ${i === 0 ? "border-red-500 text-zinc-100" : "border-zinc-800 text-zinc-500"}`}
                >
                  {msg}
                </motion.div>
              ))}
              {log.length === 0 && (
                <div className="text-xs text-zinc-700 italic text-center py-10">Ожидание начала матча...</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
