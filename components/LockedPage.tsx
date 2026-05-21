"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Lock, ChevronRight, Sparkles } from "lucide-react";
import { useProgression } from "@/lib/progression";
import { pageUnlockLevel } from "@/lib/db";

interface LockedPageProps {
  page: string;
  title: string;
  description: string;
}

export function LockedPage({ page, title, description }: LockedPageProps) {
  const { level, xp, currentXp, nextXp } = useProgression();
  const requiredLevel = pageUnlockLevel[page] || 1;
  const xpNeeded = Math.max(0, getLevelXpThreshold(requiredLevel) - xp);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="text-muted-foreground text-sm mb-6">{description}</p>
          <div className="w-full space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Уровень {level}</span>
              <span className="font-medium">Нужен уровень {requiredLevel}</span>
            </div>
            <Progress value={nextXp > 0 ? (currentXp / nextXp) * 100 : 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {xpNeeded > 0 ? `Ещё ${xpNeeded} МР до разблокировки` : "Готово к разблокировке!"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-3 py-2 rounded-lg">
            <Sparkles className="w-3.5 h-3.5" />
            Каждые 100 МР = 1 XP
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getLevelXpThreshold(level: number): number {
  const thresholds: Record<number, number> = { 1: 0, 2: 5, 3: 15, 4: 30, 5: 50, 6: 75, 7: 100, 8: 150, 9: 200, 10: 300, 11: 500 };
  return thresholds[level] || 0;
}
