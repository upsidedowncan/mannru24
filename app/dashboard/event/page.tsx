"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Moon, Star, Gift, Sparkles, CheckCircle2, RefreshCw, Calendar, Heart } from "lucide-react";
import { toast } from "sonner";
import { useProgression } from "@/lib/progression";
import { isEventActive } from "@/lib/events";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCallback } from "react";
import type { UserProfile } from "@/lib/db";

export default function EventPage() {
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
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

  const claimGift = async () => {
    setClaiming(true);
    try {
      const res = await fetch("/api/event/claim", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        toast.success("Подарок получен!", {
          description: `Вы получили ${data.giftAmount} MR и ${data.xpAmount} XP.`,
        });

        if (data.levelUps && data.levelUps.length > 0) {
          // Update progression state with new level info
          // We need fresh user data for currentXp/nextXp
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
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight">
            Курбан-байрам <span className="text-emerald-500">2026</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            В честь праздника Маннру Банк дарит всем пользователям праздничный бонус.
            Мы ценим ваше доверие и желаем процветания вашему капиталу!
          </p>

          <div className="flex flex-wrap gap-4">
             <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                 <Gift className="w-6 h-6 text-emerald-500" />
               </div>
               <div>
                 <p className="text-[10px] uppercase text-emerald-500/70 font-bold">Ваш подарок</p>
                 <p className="text-xl font-bold text-white">500 MR + 10 XP</p>
               </div>
             </div>

             <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                 <Calendar className="w-6 h-6 text-zinc-400" />
               </div>
               <div>
                 <p className="text-[10px] uppercase text-zinc-500 font-bold">Длительность</p>
                 <p className="text-xl font-bold text-white">До 30 мая</p>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-zinc-950 border-zinc-900 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Праздничный бонус
            </CardTitle>
            <CardDescription>
              Нажмите кнопку ниже, чтобы зачислить подарок на ваш бонусный баланс.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            {isClaimed ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-1">Подарок получен</h3>
                <p className="text-zinc-400 text-sm">Вы уже забрали свой праздничный бонус. Ждите следующих событий!</p>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={claimGift}
                  disabled={claiming}
                  variant="gradient"
                  className="w-full h-20 text-xl font-bold gap-3 shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
                >
                  {claiming ? <RefreshCw className="w-6 h-6 animate-spin" /> : (
                    <>Забрать подарок <Gift className="w-6 h-6" /></>
                  )}
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Статистика ивента</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-zinc-400">Статус</span>
                 <span className="text-emerald-500 font-bold">Активен</span>
               </div>
               <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 w-[80%]" />
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
