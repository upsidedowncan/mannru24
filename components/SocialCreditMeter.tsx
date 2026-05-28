"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StarFilledIcon } from "@radix-ui/react-icons";

export function SocialCreditMeter({ level, balance }: { level: number; balance: number }) {
  // Satirical calculation: level matters more than money, but debt is bad
  const baseScore = 300;
  const levelBonus = level * 50;
  const balanceBonus = Math.floor(balance / 1000) * 10;
  const totalScore = Math.min(1000, baseScore + levelBonus + balanceBonus);

  let status = "Лояльный гражданин";
  let color = "text-emerald-500";
  if (totalScore < 400) { status = "Подозрительный элемент"; color = "text-red-500"; }
  else if (totalScore < 600) { status = "Средний налогоплательщик"; color = "text-yellow-500"; }
  else if (totalScore > 900) { status = "Гордость Системы"; color = "text-blue-500"; }

  return (
    <Card className="bg-zinc-950 border-zinc-900 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <StarFilledIcon className="w-16 h-16" />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
          Социальный Кредит
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 mb-4">
          <span className={`text-4xl font-black ${color}`}>{totalScore}</span>
          <span className="text-xs text-zinc-500 mb-1">/ 1000</span>
        </div>
        <Progress value={(totalScore / 1000) * 100} className="h-1.5 mb-2" />
        <p className={`text-[10px] font-bold uppercase tracking-tighter ${color}`}>{status}</p>
        <p className="text-[9px] text-zinc-600 mt-2 italic">"Система видит твою преданность."</p>
      </CardContent>
    </Card>
  );
}
