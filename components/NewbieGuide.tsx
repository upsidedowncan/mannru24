"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RocketIcon, TargetIcon, CheckCircledIcon, LightningBoltIcon, EyeNoneIcon } from "@radix-ui/react-icons";

export function NewbieGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem("mannru_guide_shown");
    if (!shown) {
      setOpen(true);
    }
  }, []);

  const closeGuide = () => {
    localStorage.setItem("mannru_guide_shown", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <EyeNoneIcon className="w-6 h-6 text-blue-500" />
            Добро пожаловать в Систему
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Краткий курс выживания для тех, кто думает, что это просто банк.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-6 py-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-800">
                <TargetIcon className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">Ваш статус — ничто</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Вы начали с 1 уровня. Большинство функций заблокировано. Хотите переводы? Качайтесь. Хотите инвестиции? Качайтесь до 15 уровня. Мы не раздаём привилегии просто так.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-800">
                <RocketIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">Как получать XP</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Тратьте воображаемые MR с карт, выполняйте циничные задания в разделе «Задания» и активируйте бонусы. Каждые 100 MR трат приносят вам 1 XP. Чем выше уровень, тем больше XP нужно для следующего.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-800">
                <CheckCircledIcon className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">Безопасность (ха-ха)</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Мы используем 4-эмодзи коды для переводов. Не спрашивайте почему. Это выглядит солидно и абсолютно бесполезно.
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-[10px] text-blue-400 font-mono leading-tight">
                Внимание: Банк Маннру не несет ответственности за вашу самооценку при получении уведомлений о недостаточном уровне.
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={closeGuide} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6">
            Я ВСЁ ПОНЯЛ, ПУСТИТЕ МЕНЯ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
