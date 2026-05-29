"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RiCalendarEventLine, RiFlashlightLine, RiStarFill, RiGiftLine, RiInformationLine, RiArrowRightUpLine, RiCheckboxCircleLine } from "react-icons/ri";
import { toast } from "sonner";
import { useProgression } from "@/lib/progression";
import type { UserProfile } from "@/lib/db";
import { isEventActive } from "@/lib/events";
import { withAccess } from "@/components/AccessGuard";

function KurbanEventPage() {
  const { refresh: refreshProgression } = useProgression();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const active = isEventActive("kurban");

  const fetchData = async () => {
    try {
      const [userRes, statsRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/event/calculate")
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClaim = async () => {
    if (claiming || !active) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/event/claim", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Подарки получены!", {
          description: `Зачислено ${data.mrAmount} MR и ${data.xpAmount} XP. Создана специальная карта.`
        });
        refreshProgression();
        fetchData();
      } else {
        toast.error(data.error || "Ошибка получения");
      }
    } catch (e) {
      toast.error("Сетевая ошибка");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return <div className="space-y-6"><div className="h-8 w-48 bg-secondary rounded animate-pulse" /><div className="h-[400px] bg-secondary rounded-xl animate-pulse" /></div>;
  if (!user) return null;

  const isClaimed = user.claimedGifts?.includes("kurban_2024");

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-950 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider">
            <RiCalendarEventLine className="w-3.5 h-3.5" /> Специальное событие
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight italic">КУРБАН БАЙРАМ 🐏</h1>
          <p className="text-emerald-100/80 text-lg max-w-xl leading-relaxed">
            Празднуйте священный Курбан Байрам вместе с Маннру Банком. Получите эксклюзивные награды и специальную "Карту Подарков".
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
             <div className="px-4 py-2 bg-black/20 rounded-xl backdrop-blur-md border border-white/10">
                <p className="text-[10px] uppercase font-bold text-emerald-300">Ваш уровень</p>
                <p className="text-2xl font-black">{user.level}</p>
             </div>
             <div className="px-4 py-2 bg-black/20 rounded-xl backdrop-blur-md border border-white/10">
                <p className="text-[10px] uppercase font-bold text-emerald-300">Награда (бараны)</p>
                <p className="text-2xl font-black">{stats?.sheepCount || 0} 🐏</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 italic">
              <RiGiftLine className="w-5 h-5 text-emerald-500" /> Ваши подарки
            </CardTitle>
            <CardDescription>Рассчитано на основе вашей активности в системе</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Сумма в МР</p>
                  <p className="text-3xl font-black text-emerald-500">+{stats?.mrAmount?.toLocaleString("ru")}</p>
               </div>
               <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Бонусный XP</p>
                  <p className="text-3xl font-black text-blue-500">+{stats?.xpAmount?.toLocaleString("ru")}</p>
               </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <RiFlashlightLine className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-sm font-bold italic">Специальная "Карта Подарков"</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Лимитированный дизайн и мгновенное зачисление праздничных выплат.</p>
               </div>
            </div>

            {isClaimed ? (
              <Button disabled className="w-full h-14 bg-emerald-500/20 text-emerald-500 font-black italic text-lg border border-emerald-500/20">
                <RiCheckboxCircleLine className="mr-2" /> ПОДАРКИ ПОЛУЧЕНЫ
              </Button>
            ) : (
              <Button
                onClick={handleClaim}
                disabled={claiming || !active}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black italic text-lg shadow-[0_8px_24px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.01]"
              >
                {claiming ? "ПОЛУЧЕНИЕ..." : "ЗАБРАТЬ ПРАЗДНИЧНЫЕ ВЫПЛАТЫ"} <RiArrowRightUpLine className="ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
               <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <RiInformationLine className="text-emerald-500" /> Условия
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
               <p>1. Выплаты доступны всем активным пользователям Маннру Банка.</p>
               <p>2. Сумма подарка рассчитывается индивидуально: чем выше ваш текущий уровень, тем ценнее "бараны".</p>
               <p>3. Карта Подарков имеет специальный тариф с кэшбэком и отсутствием комиссий на время события.</p>
               <p>4. Событие ограничено по времени. Успейте забрать награды до окончания праздника.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default withAccess(KurbanEventPage, "/dashboard/event");
