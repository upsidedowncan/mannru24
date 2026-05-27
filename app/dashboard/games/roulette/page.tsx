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
        setLog(["Система инициализирована. Начинаем протокол устранения."]);
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
    setLog(prev => [msg, ...prev].slice(0, 8));
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

  useEffect(() => {
    if (gameState === "playing" && !actionLoading) {
      const current = participants[turnIndex];
      if (current && current.isBot && !current.isDead) {
        const timer = setTimeout(() => {
          handleMove("shoot");
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [turnIndex, gameState, participants, actionLoading]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><UpdateIcon className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 relative">
      <div className="fixed inset-0 pointer-events-none opacity-40">
      </div>

      <Link href="/dashboard/games" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors relative z-10">
        <ChevronLeftIcon /> К списку игр
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sidebar Info */}
        <div className="space-y-6 hidden xl:block">
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 border-l-red-600/50 border-l-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Статус участника</h3>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center border border-red-600/30">
                 <PersonIcon className="text-red-500" />
               </div>
               <div>
                 <p className="text-sm font-bold text-white">ВЫ</p>
                 <p className="text-[10px] text-zinc-500">Био-сигнатура: OK</p>
               </div>
             </div>
          </div>

          <Card className="bg-black border-zinc-900">
             <CardHeader>
               <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Параметры матча</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600">Ставка:</span>
                  <span className="text-red-500 font-bold">{bet} МР</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600">Приз:</span>
                  <span className="text-emerald-500 font-bold">{bet * 2} МР</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600">Выбыло:</span>
                  <span className="text-zinc-400 font-bold">{participants.filter(p => p.isDead).length}</span>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Main Game Area */}
        <Card className="xl:col-span-2 bg-black border-zinc-900 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />

          <CardHeader className="text-center p-8">
            <CardTitle className="flex items-center justify-center gap-3 text-4xl font-black text-white uppercase italic tracking-tighter">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              TERMINAL ROULETTE
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-center space-y-12 p-8">
            {gameState === "lobby" ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex justify-center">
                   <div className="relative">
                      <div className="absolute inset-0 bg-red-600 blur-3xl opacity-10 animate-pulse" />
                      <div className="w-48 h-48 rounded-full border-2 border-dashed border-red-900/50 flex items-center justify-center relative">
                         <TargetIcon className="w-24 h-24 text-zinc-900" />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest ml-1">Investment</label>
                    <Input type="number" value={bet} onChange={e => setBet(Number(e.target.value))} className="h-12 bg-zinc-950 border-zinc-900 text-red-500 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest ml-1">Debit Card</label>
                    <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                      <SelectTrigger className="h-12 bg-zinc-950 border-zinc-900">
                        <SelectValue placeholder="Выберите карту" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-900">
                        {cards.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.tier.toUpperCase()} ••{c.number.slice(-4)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={startGame} disabled={actionLoading} className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black text-lg tracking-widest uppercase shadow-[0_0_40px_rgba(220,38,38,0.2)]">
                  {actionLoading ? <UpdateIcon className="animate-spin" /> : "ENTER THE VOID"}
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-12">
                {/* Visualizer for turns */}
                <div className="grid grid-cols-4 gap-3">
                  {participants.map((p, i) => (
                    <motion.div
                      key={p.id}
                      animate={{
                        borderColor: turnIndex === i ? "#dc2626" : "#18181b",
                        backgroundColor: turnIndex === i ? "rgba(220, 38, 38, 0.05)" : "transparent"
                      }}
                      className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center ${p.isDead ? "opacity-30 grayscale" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-full mb-2 flex items-center justify-center ${p.isDead ? "bg-zinc-900" : "bg-zinc-800"}`}>
                        {p.isDead ? <Cross2Icon className="text-red-600" /> : <PersonIcon className={turnIndex === i ? "text-red-500" : "text-zinc-600"} />}
                      </div>
                      <span className="text-[10px] font-black uppercase text-center truncate w-full">{p.name.split('-')[0]}</span>
                      {turnIndex === i && <motion.div layoutId="turn-indicator" className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full" />}
                    </motion.div>
                  ))}
                </div>

                <div className="min-h-[140px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {gameState === "playing" && participants[turnIndex]?.id === "player" ? (
                      <motion.div key="player-ui" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="w-full space-y-6">
                        <div className="text-center font-bold text-red-600 text-[10px] uppercase tracking-widest animate-pulse">Your turn. Decide now.</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <Button onClick={() => handleMove("shoot", "player")} disabled={actionLoading} variant="destructive" className="h-16 font-black uppercase text-xs tracking-[0.2em] border-2 border-red-600 bg-transparent hover:bg-red-600">
                             SHOOT SELF
                           </Button>
                           <div className="flex gap-2">
                             {participants.filter(p => p.id !== "player" && !p.isDead).map(other => (
                               <Button key={other.id} onClick={() => handleMove("shoot", other.id)} disabled={actionLoading} className="flex-1 h-16 bg-zinc-900 border border-zinc-800 font-bold text-[10px] uppercase">
                                 TARGET {other.name.split('-')[1] || other.name}
                               </Button>
                             ))}
                             <Button onClick={() => handleMove("pass")} disabled={actionLoading} variant="outline" className="flex-1 h-16 border-zinc-900 text-zinc-500 text-[10px] uppercase font-black">
                               PASS
                             </Button>
                           </div>
                        </div>
                      </motion.div>
                    ) : gameState === "playing" ? (
                      <motion.div key="bot-ui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
                         <UpdateIcon className="w-8 h-8 animate-spin text-zinc-800" />
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">System Processing...</p>
                      </motion.div>
                    ) : null}

                    {gameState === "won" && (
                      <motion.div key="win" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
                        <h2 className="text-6xl font-black text-emerald-500 uppercase tracking-tighter italic">SURVIVED</h2>
                        <p className="text-zinc-500 text-xs font-bold uppercase">Payout confirmed: +{bet * 2} MR</p>
                        <Button onClick={() => setGameState("lobby")} className="mt-4 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">REBOOT SESSION</Button>
                      </motion.div>
                    )}

                    {gameState === "lost" && (
                      <motion.div key="loss" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
                        <h2 className="text-6xl font-black text-red-600 uppercase tracking-tighter italic">TERMINATED</h2>
                        <p className="text-zinc-500 text-xs font-bold uppercase">Cleanup fee: -{bet} MR</p>
                        <Button onClick={() => setGameState("lobby")} className="mt-4 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">RESPAWN</Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logs */}
        <Card className="bg-black border-zinc-900 flex flex-col">
           <CardHeader className="border-b border-zinc-950">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Execution Log</CardTitle>
           </CardHeader>
           <CardContent className="flex-1 p-0 overflow-hidden relative">
              <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black to-transparent z-10" />
              <div className="h-[400px] overflow-y-auto p-4 space-y-3 font-mono">
                 {log.map((msg, i) => (
                   <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`text-[10px] leading-relaxed ${i === 0 ? "text-red-500" : "text-zinc-600"}`}>
                      <span className="opacity-30 mr-2">[{new Date().toLocaleTimeString()}]</span>
                      {msg}
                   </motion.div>
                 ))}
                 {log.length === 0 && <div className="text-[10px] text-zinc-900 uppercase font-black text-center mt-20">No active process</div>}
              </div>
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black to-transparent z-10" />
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
