"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { UpdateIcon, ChevronLeftIcon } from "@radix-ui/react-icons";
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

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><UpdateIcon className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 relative">
      <Link href="/dashboard/games" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors relative z-10">
        <ChevronLeftIcon /> К играм
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card className="bg-black border-zinc-900 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-20" />
          <CardHeader>
            <CardTitle className="text-3xl font-black italic tracking-tighter text-white uppercase">NEO-TIC-TAC</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Deep Blue AI Variant v4.2</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {gameState === "lobby" ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Entry Fee</label>
                    <Input type="number" value={bet} onChange={e => setBet(Number(e.target.value))} className="h-12 bg-zinc-950 border-zinc-900" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Payment Method</label>
                    <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                      <SelectTrigger className="h-12 bg-zinc-950 border-zinc-900">
                        <SelectValue placeholder="Карта" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-900">
                        {cards.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.tier.toUpperCase()} ••{c.number.slice(-4)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={startGame} disabled={actionLoading} className="w-full h-16 bg-blue-600 hover:bg-blue-500 font-black uppercase tracking-widest text-lg italic shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                  {actionLoading ? <UpdateIcon className="animate-spin" /> : "START SESSION"}
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-3 gap-2 aspect-square max-w-[300px] mx-auto">
                  {board.map((cell, i) => (
                    <motion.button
                      key={i}
                      whileHover={!cell && !actionLoading ? { backgroundColor: "rgba(255,255,255,0.05)" } : {}}
                      onClick={() => handleMove(i)}
                      disabled={actionLoading || !!cell}
                      className="bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-center text-4xl font-black relative overflow-hidden h-24"
                    >
                      <AnimatePresence mode="wait">
                        {cell === "X" && (
                          <motion.span key="X" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} className="text-blue-500">
                            X
                          </motion.span>
                        )}
                        {cell === "O" && (
                          <motion.span key="O" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-red-500">
                            O
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </div>

                <div className="text-center min-h-[100px] flex flex-col justify-center">
                   {gameState === "playing" ? (
                     <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                       {actionLoading ? "AI Processing (O)..." : "Your Turn (X)"}
                     </div>
                   ) : (
                     <div className="space-y-4">
                        <h3 className={`text-4xl font-black italic uppercase ${gameState === "won" ? "text-emerald-500" : gameState === "lost" ? "text-red-600" : "text-zinc-500"}`}>
                           {gameState === "won" ? "VICTORY" : gameState === "lost" ? "FAILURE" : "DRAW"}
                        </h3>
                        <Button onClick={() => setGameState("lobby")} variant="outline" className="border-zinc-900 text-[10px] font-black uppercase tracking-widest">
                          RETURN TO LOBBY
                        </Button>
                     </div>
                   )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
           <Card className="bg-zinc-950 border-zinc-900 border-l-blue-600/50 border-l-4">
             <CardHeader>
                <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">System Logs</CardTitle>
             </CardHeader>
             <CardContent className="font-mono text-[10px] text-zinc-600 space-y-2">
                <p>{">"} INITIALIZING TIC-TAC-TOE KERNEL...</p>
                <p>{">"} CONNECTING TO DEEP BLUE CLUSTER...</p>
                <p>{">"} STATUS: READY</p>
                <p>{">"} CURRENT BET: {bet} MR</p>
                <p>{">"} POSSIBLE PAYOUT: {bet * 2} MR</p>
             </CardContent>
           </Card>

           <div className="p-8 rounded-3xl bg-zinc-900/30 border border-zinc-900 text-center">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-700 mb-4">Player Portfolio</h4>
              <p className="text-4xl font-black text-white">{cards.find(c => c.id === selectedCardId)?.balance.toLocaleString()} <span className="text-sm text-zinc-500">МР</span></p>
           </div>
        </div>
      </div>
    </div>
  );
}
