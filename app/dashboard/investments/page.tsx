"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Lock, Skull, AlertTriangle, ShieldAlert, RefreshCw, FileText } from "lucide-react";
import { useProgression } from "@/lib/progression";
import { motion, AnimatePresence } from "framer-motion";

function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, 5 + Math.random() * 15);
      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  return <>{displayedText}<span className="inline-block w-1 h-4 bg-blue-500 animate-pulse ml-0.5" /></>;
}

export default function InvestmentsPage() {
  const { level } = useProgression();
  const [revealing, setRevealing] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const startReveal = async () => {
    setRevealing(true);
    setReport(null);
    setTerminalLogs([]);

    // Multi-step fake terminal logic for drama
    const steps = [
      ">> Доступ разрешен. Уровень 15 подтвержден.",
      ">> Инициализация модуля 'Великий Кредитный Заговор'...",
      ">> Сканирование истории кликов за всё время...",
      ">> Анализ попыток перехитрить систему...",
      ">> Соединение с ИИ Банка (openrouter/owl-alpha)...",
      ">> Генерация штрафного отчета..."
    ];

    for (const step of steps) {
      setTerminalLogs(prev => [...prev, step]);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const res = await fetch("/api/investments/reveal", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setReport(data.reveal);
      } else {
        setReport(`КРИТИЧЕСКАЯ ОШИБКА: ${data.error || "Сбой системы"}`);
      }
    } catch (e) {
      setReport("Связь с Центром Заговоров прервана. Налоговая уже выехала.");
    } finally {
      setRevealing(false);
    }
  };

  useEffect(() => {
    if (level >= 15 && !report && !revealing) {
      startReveal();
    }
  }, [level]);

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
      <AnimatePresence mode="wait">
        {revealing && (
          <motion.div
            key="terminal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-10 space-y-8"
          >
             <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center relative">
                <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
                <div className="absolute inset-0 bg-blue-500/5 animate-pulse rounded-xl" />
             </div>

             <div className="w-full max-w-md bg-black border border-zinc-800 rounded-lg p-6 font-mono text-[11px] space-y-1 shadow-2xl">
               <div className="flex items-center gap-2 mb-4 border-b border-zinc-900 pb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-zinc-600 ml-2">mannru-core-v666.sh</span>
               </div>
               {terminalLogs.map((log, i) => (
                 <motion.p
                   key={i}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className={log.startsWith(">>") ? "text-blue-400" : "text-zinc-500"}
                 >
                   {log}
                 </motion.p>
               ))}
               <motion.div
                 animate={{ opacity: [1, 0, 1] }}
                 transition={{ repeat: Infinity, duration: 0.8 }}
                 className="inline-block w-2 h-4 bg-zinc-700 align-middle ml-1"
               />
             </div>
          </motion.div>
        )}

        {report && !revealing && (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2 mb-12">
               <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <Skull className="w-10 h-10 text-red-500" />
               </div>
               <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">Расплата наступила</h1>
               <p className="text-zinc-500 font-mono text-xs italic">Все ваши действия были проанализированы.</p>
            </div>

            <Card className="bg-zinc-950 border-zinc-800 border-2 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <CardHeader className="bg-zinc-900 border-b border-zinc-800 flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400">Финансовый Отчет №666</CardTitle>
                </div>
                <Badge variant="outline" className="border-red-500/50 text-red-500 text-[10px]">СТРОГО КОНФИДЕНЦИАЛЬНО</Badge>
              </CardHeader>
              <CardContent className="p-8 prose prose-invert max-w-none min-h-[300px]">
                <div className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-zinc-400">
                  <TypewriterText text={report} />
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
              <Button
                variant="outline"
                onClick={startReveal}
                className="text-zinc-500 border-zinc-800 hover:bg-zinc-900 uppercase text-[10px] tracking-widest mr-4"
              >
                Пересчитать (за плату)
              </Button>
              <Button
                variant="destructive"
                onClick={() => setReport(null)}
                className="uppercase text-[10px] tracking-widest px-8"
              >
                Я принимаю этот долг
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
