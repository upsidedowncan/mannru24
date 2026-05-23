"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Lock, Skull, AlertTriangle, ShieldAlert, RefreshCw, FileText } from "lucide-react";
import { useProgression } from "@/lib/progression";
import { motion, AnimatePresence } from "framer-motion";

export default function InvestmentsPage() {
  const { level } = useProgression();
  const [revealing, setRevealing] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const startReveal = async () => {
    setRevealing(true);
    try {
      const res = await fetch("/api/investments/reveal", { method: "POST" });
      const data = await res.json();
      setReport(data.reveal || data.error);
    } catch (e) {
      setReport("Связь с Центром Заговоров прервана. Налоговая уже выехала.");
    } finally {
      setRevealing(false);
    }
  };

  if (level < 15) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <TrendingUp className="w-10 h-10 text-blue-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter text-white uppercase">Инвестиционный Портал</h1>
          <p className="text-zinc-500 max-w-md">
            Здесь вы сможете приумножить свои воображаемые капиталы, если, конечно, обладаете достаточным уровнем цинизма.
          </p>
        </div>

        <Card className="bg-zinc-950 border-zinc-900 border-dashed max-w-sm w-full">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/5 px-3 py-1">
              <Lock className="w-3 h-3 mr-1.5" /> Требуется 15 уровень
            </Badge>
            <p className="text-xs text-zinc-600 italic">
              "Инвестиции — это способ перераспределения денег от нетерпеливых к терпеливым... или просто к нам."
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12">
      {!report && !revealing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8"
        >
          <div className="w-32 h-32 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <Skull className="w-16 h-16 text-red-500 animate-pulse" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tighter text-white uppercase leading-none">
              ВЕЛИКИЙ КРЕДИТНЫЙ <span className="text-red-600">ЗАГОВОР</span>
            </h1>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Поздравляем. Вы достигли 15 уровня. Вы думали, что инвестиции — это про прибыль?
              <br />
              Нет. Это про то, сколько вы нам <span className="text-zinc-100 font-bold underline">уже должны</span> за каждый свой клик.
            </p>
          </div>
          <Button
            onClick={startReveal}
            variant="destructive"
            size="lg"
            className="h-16 px-12 text-xl font-bold uppercase tracking-widest bg-red-600 hover:bg-red-700 shadow-2xl shadow-red-600/20"
          >
            Узнать Свою Задолженность
          </Button>
        </motion.div>
      )}

      {revealing && (
        <div className="flex flex-col items-center justify-center py-20 space-y-8">
           <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
           <div className="space-y-2 text-center">
             <p className="text-2xl font-mono text-zinc-100 animate-pulse uppercase">Анализ кликов...</p>
             <p className="text-sm text-zinc-500 font-mono italic">Подсчитываем налог на воздух в офисе...</p>
           </div>
        </div>
      )}

      {report && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="bg-zinc-950 border-zinc-800 border-2 overflow-hidden">
            <CardHeader className="bg-zinc-900 border-b border-zinc-800 flex flex-row items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400">Генеральный Финансовый Отчет №666</CardTitle>
              </div>
              <Badge variant="outline" className="border-red-500/50 text-red-500">СТРОГО КОНФИДЕНЦИАЛЬНО</Badge>
            </CardHeader>
            <CardContent className="p-8 prose prose-invert max-w-none prose-p:text-zinc-400 prose-strong:text-zinc-100">
              <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap whitespace-break-spaces">
                {report}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Статус</p>
              <p className="text-lg font-bold text-white uppercase">В черном списке</p>
            </div>
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Последствия</p>
              <p className="text-lg font-bold text-white uppercase">Лишение сна</p>
            </div>
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Процент по долгу</p>
              <p className="text-lg font-bold text-white uppercase">146% в секунду</p>
            </div>
          </div>

          <div className="text-center pt-8">
            <Button variant="outline" onClick={() => setReport(null)} className="text-zinc-500 border-zinc-800 hover:bg-zinc-900 uppercase text-[10px] tracking-widest">
              Я буду платить (но это не точно)
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
