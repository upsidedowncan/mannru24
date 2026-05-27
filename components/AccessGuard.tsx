"use client";

import { useProgression } from "@/lib/progression";
import { pageUnlockLevel } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LockClosedIcon, MagicWandIcon } from "@radix-ui/react-icons";

const pageTitles: Record<string, string> = {
  "/dashboard/history": "История",
  "/dashboard/transfers": "Переводы",
  "/dashboard/bonuses": "Бонусы",
  "/dashboard/tasks": "Задания",
};

const pageDescriptions: Record<string, string> = {
  "/dashboard/history": "Просматривайте историю всех операций",
  "/dashboard/transfers": "Отправляйте МР по emoji-коду",
  "/dashboard/bonuses": "Активируйте бонусы и получайте кэшбэк",
  "/dashboard/tasks": "Выполняйте задания и зарабатывайте баллы",
};

export function withAccess(WrappedComponent: React.ComponentType, page: string) {
  return function AccessGuard(props: any) {
    const { level, xp, currentXp, nextXp } = useProgression();
    const requiredLevel = pageUnlockLevel[page];

    if (level >= requiredLevel) {
      return <WrappedComponent {...props} />;
    }

    const xpNeeded = Math.max(0, getLevelXpThreshold(requiredLevel) - xp);
    const isInvestments = page === "/dashboard/investments";
    const isAlmostThere = isInvestments && level === 14;

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <LockClosedIcon className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${isAlmostThere ? "text-red-500 animate-pulse" : ""}`}>
              {isAlmostThere ? "ВХОД ВОСПРЕЩЕН" : (pageTitles[page] || "Раздел")}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {isAlmostThere
                ? "Вы на пороге Истины. Система наблюдает за вашим прогрессом. Путь к 15 уровню станет вашим последним свободным выбором."
                : (pageDescriptions[page] || "Этот раздел ещё заблокирован")}
            </p>
            <div className="w-full space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Уровень {level}</span>
                <span className="font-medium">Нужен уровень {requiredLevel}</span>
              </div>
              <Progress value={nextXp > 0 ? (currentXp / nextXp) * 100 : 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {xpNeeded > 0 ? `Ещё ${xpNeeded} XP до разблокировки` : "Готово!"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-3 py-2 rounded-lg">
              <MagicWandIcon className="w-3.5 h-3.5" />
              Тратьте МР, чтобы получать XP
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
}

function getLevelXpThreshold(level: number): number {
  const thresholds: Record<number, number> = { 1: 0, 2: 5, 3: 15, 4: 30, 5: 50, 6: 75, 7: 100, 8: 150, 9: 200, 10: 300, 11: 500 };
  return thresholds[level] || 0;
}
