"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityLogIcon } from "@radix-ui/react-icons";

const satiricalEvents = [
  "Пользователь проявил излишнее любопытство к балансу.",
  "Обнаружена попытка быть счастливым без разрешения.",
  "Система оптимизировала ваши надежды до нуля.",
  "Зафиксирован подозрительный уровень свободного времени.",
  "Алгоритм предсказал ваше следующее неудачное решение.",
  "Ваша лояльность была автоматически подтверждена (налогом).",
  "Обнаружен всплеск энтузиазма. Требуется калибровка.",
  "Обновление протоколов смирения... Готово.",
  "Ваши данные проданы анонимному благотворителю.",
];

export function SystemLogs() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Pick 4 random logs
    const shuffled = [...satiricalEvents].sort(() => 0.5 - Math.random());
    setLogs(shuffled.slice(0, 4));
  }, []);

  return (
    <Card className="bg-zinc-950 border-zinc-900">
      <CardHeader className="pb-2 border-b border-zinc-900">
        <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
          <ActivityLogIcon className="w-3 h-3" /> Системный Журнал
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-3 items-start group">
              <span className="text-[9px] font-mono text-zinc-700 mt-0.5">[{new Date().getHours()}:{new Date().getMinutes()}]</span>
              <p className="text-[10px] text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">{log}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
