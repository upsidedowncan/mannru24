"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiRocketLine, RiCrosshairLine, RiCheckDoubleLine, RiFlashlightLine, RiEyeOffLine } from "react-icons/ri";

const steps = [
  {
    title: "Игровой зал",
    description: "Начните с игр, чтобы заработать первые МР и XP.",
    icon: RiRocketLine,
  },
  {
    title: "Система уровней",
    description: "Повышайте уровень, чтобы открыть новые тарифы карт и функции.",
    icon: RiCrosshairLine,
  },
  {
    title: "Задания",
    description: "Выполняйте ежедневные задания для быстрого прогресса.",
    icon: RiCheckDoubleLine,
  },
  {
    title: "Бонусы",
    description: "Обменивайте баллы лояльности на реальные МР.",
    icon: RiFlashlightLine,
  },
];

export function NewbieGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem("mannru_guide_shown");
    if (!shown) {
      setOpen(true);
    }
  }, []);

  const close = () => {
    setOpen(false);
    localStorage.setItem("mannru_guide_shown", "true");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-2xl border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold italic">Добро пожаловать в Маннру!</CardTitle>
          <CardDescription>Краткое руководство для нового пользователя</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <step.icon className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold uppercase tracking-tight italic">{step.title}</h4>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={close} className="w-full h-12 font-black italic" variant="gradient">
            ПОНЯТНО, ПОЕХАЛИ! <RiRocketLine className="ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
