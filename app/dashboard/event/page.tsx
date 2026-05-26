"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Moon, Star, Gift, CheckCircle2, RefreshCw, Calendar, Heart, Terminal, Ghost } from "lucide-react";
import { toast } from "sonner";
import { useProgression } from "@/lib/progression";
import { isEventActive } from "@/lib/events";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { UserProfile } from "@/lib/db";

export default function EventPage() {
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [calcResult, setCalcResult] = useState<{ sheepCount: number; giftAmount: number; xpAmount: number; reason: string } | null>(null);
  const [stage, setStage] = useState<"intro" | "calculating" | "result">("intro");
  const [logs, setLogs] = useState<string[]>([]);

  const { triggerLevelUps, refresh } = useProgression();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/user");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data);
      if (data.claimedGifts?.includes("kurban-2026")) {
        setStage("result");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isEventActive("kurban")) {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [router, fetchData]);

  const startCalculation = async () => {
    setStage("calculating");
    setLogs([]);

    const fakeLogs = [
      "Инициализация системы Овца-Альфа v1.0...",
      "Сканирование истории кликов за 2026 год...",
      "Анализ подозрительной активности в разделе карт...",
      "Оценка уровня лояльности к цифровому капиталу...",
      "Проверка на наличие скрытых долгов...",
      "Подсчет барашков на душу населения...",
      "Генерация саркастичного обоснования...",
    ];

    for (let i = 0; i < fakeLogs.length; i++) {
      setLogs(prev => [...prev, fakeLogs[i]]);
      await new Promise(r => setTimeout(r, 800));
    }

    setCalculating(true);
    try {
      const res = await fetch("/api/event/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calculateOnly: true })
      });
      const data = await res.json();
      if (res.ok) {
        setCalcResult(data);
        setStage("result");
      } else {
        toast.error(data.error || "Ошибка калькулятора");
        setStage("intro");
      }
    } catch {
      toast.error("Ошибка сети");
      setStage("intro");
    } finally {
      setCalculating(false);
    }
  };

  const claimGift = async () => {
    setClaiming(true);
    try {
      const res = await fetch("/api/event/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calculateOnly: false })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Подарки зачислены!", {
          description: `Вы получили ${data.sheepCount} барашков (${data.giftAmount} MR) и ${data.xpAmount} XP.`,
        });

        if (data.levelUps && data.levelUps.length > 0) {
          const userRes = await fetch("/api/user");
          const userData = await userRes.json();
          triggerLevelUps(data.levelUps, userData.level, userData.xp, userData.currentXp, userData.nextXp);
        }

        fetchData();
        refresh();
      } else {
        toast.error(data.error || "Ошибка при получении подарка");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  );

  const isClaimed = user?.claimedGifts?.includes("kurban-2026");

  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-3xl bg-emerald-950/20 border border-emerald-500/20 p-8 lg:p-12">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Moon className="w-64 h-64 text-emerald-500 fill-emerald-500" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <Badge className="mb-4 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
            Специальное событие
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight leading-none">
            Курбан-байрам <span className="text-emerald-500 italic">2026</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Наш ИИ-алгоритм «Овца-Альфа» проанализирует ваши грехи и заслуги в Банке Маннру, чтобы выдать справедливое количество барашков. Один барашек равен 500 MR.
          </p>

          <div className="flex flex-wrap gap-4">
             <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                 <Ghost className="w-6 h-6 text-emerald-500" />
               </div>
               <div>
                 <p className="text-[10px] uppercase text-emerald-500/70 font-bold">Текущий курс</p>
                 <p className="text-xl font-bold text-white">1 🐑 = 500 MR</p>
               </div>
             </div>

             <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                 <Calendar className="w-6 h-6 text-zinc-400" />
               </div>
               <div>
                 <p className="text-[10px] uppercase text-zinc-500 font-bold">Окончание</p>
                 <p className="text-xl font-bold text-white">30 мая</p>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-zinc-950 border-zinc-900 overflow-hidden relative min-h-[400px] flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />

          <AnimatePresence mode="wait">
            {stage === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-8 flex-1 flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Terminal className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Готовы к расчету?</h3>
                  <p className="text-zinc-400 max-w-md">
                    Наш алгоритм изучит каждый ваш клик, каждую транзакцию и каждый раз, когда вы просто смотрели на баланс, чтобы определить вашу долю.
                  </p>
                </div>
                <Button
                  onClick={startCalculation}
                  disabled={calculating}
                  variant="gradient"
                  className="w-full max-w-xs h-14 text-lg font-bold shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                >
                  {calculating ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Запустить расчет барашков"}
                </Button>
              </motion.div>
            )}

            {stage === "calculating" && (
              <motion.div
                key="calculating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 flex-1 font-mono text-xs text-emerald-500 space-y-2 overflow-y-auto"
              >
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                  >
                    {`> ${log}`}
                  </motion.div>
                ))}
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-2 h-4 bg-emerald-500 ml-1"
                />
              </motion.div>
            )}

            {stage === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 flex-1 flex flex-col items-center justify-center text-center"
              >
                {(calcResult || isClaimed) && (
                  <>
                    <div className="relative mb-6">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-7xl"
                      >
                        🐑
                      </motion.div>
                      <div className="absolute -top-2 -right-4 bg-emerald-500 text-black text-xl font-black px-3 py-1 rounded-full shadow-xl">
                        x{calcResult?.sheepCount || "?"}
                      </div>
                    </div>

                    <div className="space-y-2 mb-8">
                      <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                        Результат: {calcResult ? `${calcResult.giftAmount.toLocaleString()} MR` : isClaimed ? "ПОДАРКИ ПОЛУЧЕНЫ" : "???"}
                      </h3>
                      <p className="text-emerald-500 font-mono text-sm italic max-w-md px-4">
                        &quot;{calcResult?.reason || (isClaimed ? "Вы уже получили свои подарки. ИИ доволен вашим прогрессом." : "Генерация обоснования...")}&quot;
                      </p>
                    </div>

                    {!isClaimed ? (
                      <Button
                        onClick={claimGift}
                        disabled={claiming}
                        variant="gradient"
                        className="w-full max-w-xs h-16 text-xl font-black gap-3 shadow-[0_10px_40px_rgba(16,185,129,0.3)]"
                      >
                        {claiming ? <RefreshCw className="w-6 h-6 animate-spin" /> : (
                          <>ЗАБРАТЬ ВСЁ <Gift className="w-6 h-6" /></>
                        )}
                      </Button>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Badge variant="success" className="h-10 px-6 text-base gap-2">
                          <CheckCircle2 className="w-5 h-5" /> ПОДАРКИ ПОЛУЧЕНЫ
                        </Badge>
                        <p className="text-zinc-500 text-xs mt-2">Ваш капитал вырос на {calcResult?.giftAmount || "?"} MR</p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <Card className="bg-zinc-950 border-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Статистика ивента</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-zinc-400">Статус Овца-Альфа</span>
                 <span className="text-emerald-500 font-bold">ОНЛАЙН</span>
               </div>
               <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 w-[100%] animate-pulse" />
               </div>
             </div>

             <div className="pt-4 border-t border-zinc-900 space-y-4">
               <div className="flex items-start gap-3">
                 <div className="p-2 rounded-lg bg-emerald-500/10">
                   <Heart className="w-4 h-4 text-emerald-500" />
                 </div>
                 <div>
                   <p className="text-xs font-bold text-white">Благотворительность</p>
                   <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                     1% от всех транзакций в эти дни Маннру Банк направит на развитие ИИ-котиков.
                   </p>
                 </div>
               </div>

               <div className="flex items-start gap-3">
                 <div className="p-2 rounded-lg bg-blue-500/10">
                   <Star className="w-4 h-4 text-blue-500" />
                 </div>
                 <div>
                   <p className="text-xs font-bold text-white">Множитель опыта</p>
                   <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                     Получайте в 1.5 раза больше XP за выполнение ежедневных заданий.
                   </p>
                 </div>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Традиции", desc: "Маннру чтит цифровые традиции." },
          { title: "Единство", desc: "Банк объединяет все ваши счета." },
          { title: "Забота", desc: "Мы заботимся о вашем кэшбэке." },
          { title: "Будущее", desc: "Исламский банкинг в разработке." }
        ].map((item, i) => (
          <Card key={i} className="bg-zinc-900/30 border-zinc-800/50">
            <CardContent className="p-4">
              <h4 className="text-xs font-bold text-emerald-500 mb-1 uppercase tracking-widest">{item.title}</h4>
              <p className="text-[11px] text-zinc-500">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
