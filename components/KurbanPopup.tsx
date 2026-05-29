"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RiMoonLine, RiStarFill, RiArchiveLine, RiCloseLine } from "react-icons/ri";
import { useProgression } from "@/lib/progression";

export function KurbanPopup() {
  const [open, setOpen] = useState(false);
  const { xp } = useProgression();

  useEffect(() => {
    const shown = sessionStorage.getItem("kurban_popup_shown");
    if (!shown) {
      setOpen(true);
      sessionStorage.setItem("kurban_popup_shown", "true");
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-emerald-950 border-emerald-800 text-emerald-50">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-emerald-900 flex items-center justify-center border-4 border-emerald-800 shadow-2xl relative">
              <RiMoonLine className="w-10 h-10 text-yellow-400" />
              <RiStarFill className="w-4 h-4 text-yellow-400 absolute top-4 right-4 animate-pulse" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-emerald-100">
            Курбан Байрам в Маннру! 🐏
          </DialogTitle>
          <DialogDescription className="text-emerald-400 text-center text-sm mt-2">
            Празднуйте с нами и получайте щедрые награды в МР и XP.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 text-center">
          <p className="text-sm leading-relaxed">
            В честь праздника мы запустили специальный «Калькулятор Баранов». Чем выше ваш уровень и активность, тем больше праздничных выплат вы получите!
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-emerald-900/50 rounded-lg border border-emerald-700/50">
              <p className="text-xs text-emerald-400 uppercase font-bold">Ваш вклад</p>
              <p className="text-xl font-bold text-yellow-400">{xp} XP</p>
            </div>
            <div className="p-3 bg-emerald-900/50 rounded-lg border border-emerald-700/50">
              <p className="text-xs text-emerald-400 uppercase font-bold">Статус</p>
              <p className="text-xl font-bold text-yellow-400">Активен</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-emerald-950 font-black py-6 gap-2"
            onClick={() => {
              window.location.href = "/dashboard/event";
              setOpen(false);
            }}
          >
            Получить подарки <RiArchiveLine className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            className="text-emerald-400 hover:text-emerald-100 hover:bg-emerald-900/50"
            onClick={() => setOpen(false)}
          >
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
