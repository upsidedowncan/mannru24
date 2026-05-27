"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RocketIcon, TargetIcon, DiscIcon, GridIcon, ArchiveIcon, HeartIcon, CrumpledPaperIcon, UpdateIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const games = [
  {
    id: "slots",
    title: "GOLD SLOTS",
    description: "Премиальный азарт для тех, кто не боится потерять всё.",
    icon: DiscIcon,
    color: "from-amber-400 to-amber-700",
    href: "/dashboard/games/slots",
    tag: "High Stakes",
  },
  {
    id: "roulette",
    title: "TERMINAL ROULETTE",
    description: "Игра на выживание в цифровом вакууме. Только один выйдет победителем.",
    icon: TargetIcon,
    color: "from-red-600 to-rose-950",
    href: "/dashboard/games/roulette",
    tag: "Survival",
  },
  {
    id: "ttt",
    title: "NEO-TIC-TAC",
    description: "Классика в неоновой обертке. Победи ИИ и забери куш.",
    icon: GridIcon,
    color: "from-blue-600 to-indigo-900",
    href: "/dashboard/games/ttt",
    tag: "Strategy",
  },
];

export default function GamesPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [amount, setAmount] = useState(100);
  const [poolBalance, setPoolBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/charity");
      const data = await res.json();
      setPoolBalance(data.balance);
    } catch (e) {}
  };

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
    fetchStats();
  }, []);

  const handleDeposit = async () => {
    if (!selectedCardId || amount <= 0) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/charity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deposit", amount, cardId: selectedCardId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Ваша щедрость не знает границ");
        setPoolBalance(data.poolBalance);
        setCards(prev => prev.map(c => c.id === selectedCardId ? { ...c, balance: data.newBalance } : c));
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Сетевая ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/charity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Вы забрали жалкие крошки из ларька.");
        setPoolBalance(data.poolBalance);
        setCards(prev => prev.map((c, i) => i === 0 ? { ...c, balance: data.newBalance } : c));
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Сетевая ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><UpdateIcon className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-12 pb-20 relative">
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic text-white leading-none">THE <span className="text-zinc-800">ZONE</span></h1>
          <p className="text-zinc-500 mt-4 max-w-lg text-lg">
            Центральный узел развлечений и социальной ответственности Системы.
          </p>
        </div>
      </div>

      <Tabs defaultValue="games" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-950 border border-zinc-900 h-14 p-1 rounded-2xl">
          <TabsTrigger value="games" className="rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-zinc-900 data-[state=active]:text-white">
            <RocketIcon className="mr-2" /> Игровая Зона
          </TabsTrigger>
          <TabsTrigger value="charity" className="rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-emerald-950/30 data-[state=active]:text-emerald-500">
            <HeartIcon className="mr-2" /> Ларёк для бедных
          </TabsTrigger>
        </TabsList>

        <TabsContent value="games" className="mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {games.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
              >
                <Link href={game.href}>
                  <Card className="group relative overflow-hidden h-full border-zinc-900 bg-black hover:border-zinc-700 transition-all duration-500 rounded-[2rem]">
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700`} />
                    <CardHeader className="relative z-10 p-8">
                      <div className="flex justify-between items-start">
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${game.color} shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
                          <game.icon className="w-8 h-8 text-white" />
                        </div>
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest text-zinc-500 border-zinc-800">
                          {game.tag}
                        </Badge>
                      </div>
                      <CardTitle className="mt-8 text-3xl font-black italic tracking-tighter group-hover:text-white transition-colors uppercase">{game.title}</CardTitle>
                      <CardDescription className="text-zinc-600 text-sm mt-4 leading-relaxed font-medium">
                        {game.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 p-8 pt-0">
                      <div className="flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-zinc-800 group-hover:text-white transition-all duration-500">
                        INITIALIZE <RocketIcon className="ml-3 w-4 h-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="charity" className="mt-12 space-y-8">
          <div className="relative p-12 bg-gradient-to-br from-zinc-900 to-black rounded-[3rem] border border-zinc-800 overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
               <ArchiveIcon className="w-64 h-64 rotate-12" />
            </div>
            <div className="relative z-10 space-y-6">
               <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase">СОЦИАЛЬНЫЙ <span className="text-zinc-600">ЛИФТ</span></h2>
               <div className="flex items-center gap-6 pt-4">
                  <div>
                     <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Фонд помощи</p>
                     <p className="text-4xl font-black text-emerald-500">{poolBalance.toLocaleString()} <span className="text-sm">МР</span></p>
                  </div>
                  <div className="h-12 w-[1px] bg-zinc-800" />
                  <div>
                     <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Статус ларька</p>
                     <p className="text-xl font-bold text-white uppercase">{poolBalance > 500 ? "Активен" : "Нуждается в пополнении"}</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-black border-zinc-900 rounded-[2rem]">
              <CardHeader className="p-8">
                <CardTitle className="text-xl font-black uppercase italic text-white flex items-center gap-2">
                   <HeartIcon className="text-red-500" /> СДЕЛАТЬ ВЗНОС
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Карта</label>
                     <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-900 h-12">
                           <SelectValue placeholder="Карта" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-900">
                          {cards.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.tier.toUpperCase()} • {c.balance} МР</SelectItem>
                          ))}
                        </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Сумма</label>
                     <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="bg-zinc-950 border-zinc-900 h-12 text-emerald-500 font-bold" />
                   </div>
                 </div>
                 <Button onClick={handleDeposit} disabled={actionLoading} className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest italic rounded-xl">
                    ОТДАТЬ В СИСТЕМУ
                 </Button>
              </CardContent>
            </Card>

            <Card className="bg-black border-zinc-900 rounded-[2rem]">
              <CardHeader className="p-8">
                <CardTitle className="text-xl font-black uppercase italic text-white flex items-center gap-2">
                   <CrumpledPaperIcon className="text-zinc-500" /> ПОЛУЧИТЬ ПОМОЩЬ
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 flex flex-col justify-between h-[250px]">
                 <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-900 text-center">
                    <p className="text-[10px] font-black uppercase text-zinc-700 mb-2">Фиксированная выплата</p>
                    <p className="text-5xl font-black text-white">50 <span className="text-sm text-zinc-600">МР</span></p>
                 </div>
                 <Button
                   onClick={handleWithdraw}
                   disabled={actionLoading || poolBalance < 50}
                   variant="outline"
                   className="w-full h-14 border-zinc-800 text-zinc-500 hover:text-white font-black uppercase tracking-widest italic rounded-xl"
                 >
                    ЗАБРАТЬ ПОСОБИЕ
                 </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
