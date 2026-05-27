"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MoonIcon,
  StarFilledIcon,
  ArchiveIcon,
  CheckCircledIcon,
  UpdateIcon,
  CalendarIcon,
  InfoCircledIcon,
  PieChartIcon
} from "@radix-ui/react-icons";
import { useProgression } from "@/lib/progression";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface EventStats {
  sheepCount: number;
  mrReward: number;
  xpReward: number;
  totalClaimed: boolean;
}

export default function KurbanEventPage() {
  const { level, xp } = useProgression();
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/event/calculate");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      toast.error("Ошибка загрузки данных события");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await fetch("/api/event/claim", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        toast.success("Подарки получены!", {
          description: `Зачислено ${data.mr} МР и ${data.xp} XP`,
        });
        fetchStats();
        // Force refresh progression in header
        window.dispatchEvent(new Event("progression-update"));
      } else {
        toast.error(data.error || "Ошибка при получении");
      }
    } catch (e) {
      toast.error("Сетевая ошибка");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><UpdateIcon className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-zinc-950 border border-emerald-800 p-8 md:p-12">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <MoonIcon className="w-64 h-64 text-yellow-400" />
        </div>

        <div className="relative z-10 space-y-6">
          <Badge className="bg-yellow-500 text-emerald-950 hover:bg-yellow-400 border-none px-4 py-1">
            <CalendarIcon className="mr-2 w-3 h-3" /> Спецсобытие: Курбан Байрам
          </Badge>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
            КАЛЬКУЛЯТОР <br /> <span className="text-yellow-400 underline decoration-emerald-500/50">БАРАНОВ</span>
          </h1>

          <p className="text-emerald-300/80 max-w-xl text-lg leading-relaxed">
            В честь священного праздника ИИ-алгоритм «Owl Alpha» проанализировал вашу активность и конвертировал её в праздничные бараны. Каждый баран — это реальные МР и XP.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Results Card */}
        <Card className="md:col-span-2 bg-zinc-950 border-emerald-900/50 shadow-2xl shadow-emerald-500/5">
          <CardHeader>
            <CardTitle className="text-emerald-100 flex items-center gap-2">
              <PieChartIcon className="text-emerald-500 w-5 h-5" /> Расчёт вознаграждения
            </CardTitle>
            <CardDescription className="text-emerald-600/80 uppercase text-[10px] tracking-widest font-bold">
              AI Analysis Result // Session ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center justify-center p-8 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 relative overflow-hidden">
              <div className="text-center relative z-10">
                <p className="text-emerald-500 text-xs font-bold uppercase tracking-tighter mb-2">Начислено баранов</p>
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-8xl font-black text-white"
                >
                  {stats?.sheepCount}
                </motion.span>
                <div className="mt-4 flex justify-center gap-1">
                  {Array.from({ length: Math.min(5, stats?.sheepCount || 0) }).map((_, i) => (
                    <StarFilledIcon key={i} className="w-4 h-4 text-yellow-500" />
                  ))}
                </div>
              </div>
              {/* Decorative background icons */}
              <MoonIcon className="absolute -left-4 -bottom-4 w-24 h-24 text-emerald-500/10 -rotate-12" />
              <ArchiveIcon className="absolute -right-4 -top-4 w-24 h-24 text-emerald-500/10 rotate-12" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase mb-1">Выплата в МР</p>
                <p className="text-2xl font-bold text-yellow-500">+{stats?.mrReward.toLocaleString()} МР</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase mb-1">Бонус XP</p>
                <p className="text-2xl font-bold text-emerald-500">+{stats?.xpReward} XP</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-emerald-500/5 border-t border-emerald-500/10 p-6">
            {stats?.totalClaimed ? (
              <div className="w-full flex items-center justify-center gap-3 text-emerald-500 font-bold py-3 bg-emerald-500/10 rounded-xl">
                <CheckCircledIcon className="w-6 h-6" /> ПОДАРКИ УЖЕ ПОЛУЧЕНЫ
              </div>
            ) : (
              <Button
                onClick={handleClaim}
                disabled={claiming}
                variant="gradient"
                className="w-full h-16 text-lg font-black tracking-tighter gap-3 shadow-[0_10px_30px_rgba(59,130,246,0.3)]"
              >
                {claiming ? "КОНВЕРТАЦИЯ..." : <>ЗАБРАТЬ ВСЁ <ArchiveIcon className="w-6 h-6" /></>}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Info Card */}
        <div className="space-y-6">
          <Card className="bg-zinc-950 border-zinc-900">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <InfoCircledIcon className="w-4 h-4 text-emerald-500" /> Как это работает?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-400 space-y-4 leading-relaxed">
              <p>
                Наша нейросеть анализирует ваш текущий уровень и накопленный XP, чтобы определить степень вашей благодати в Системе.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
                  <span>Базовая ставка: 10 МР за каждый уровень</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
                  <span>Множитель за XP: 0.1 МР за 1 XP</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
                  <span>Лимит: до 10 000 МР за событие</span>
                </li>
              </ul>
              <p className="pt-2 text-[10px] italic border-t border-zinc-900">
                *Награды зачисляются на специальную праздничную карту с повышенным кэшбэком.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-emerald-950/20 border-emerald-900/30">
            <CardContent className="p-6">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <UpdateIcon className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-100 uppercase">След. событие</p>
                  <p className="text-lg font-black text-emerald-500 tracking-tighter">СКОРО</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
