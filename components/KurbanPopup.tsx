"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Moon, Star, Gift, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { isEventActive } from "@/lib/events";
import { motion } from "framer-motion";

export function KurbanPopup() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isEventActive("kurban")) return;

    const hasSeen = sessionStorage.getItem("kurban-popup-seen");
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem("kurban-popup-seen", "true");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const goToEvent = () => {
    setOpen(false);
    router.push("/dashboard/event");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm bg-zinc-950 border-emerald-900/50 p-0 overflow-hidden">
        <DialogTitle className="sr-only">Курбан-байрам</DialogTitle>
        <div className="relative p-6 flex flex-col items-center text-center">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mb-6 relative">
             <motion.div
               animate={{ rotate: [0, 10, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity }}
               className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"
             >
               <Moon className="w-10 h-10 text-emerald-500 fill-emerald-500" />
             </motion.div>
             <Star className="w-4 h-4 text-emerald-400 absolute -top-1 -right-1 animate-pulse" />
             <Star className="w-3 h-3 text-emerald-400 absolute bottom-2 -left-2 animate-bounce" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Курбан-байрам в Маннру!</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Поздравляем со светлым праздником! Мы подготовили для вас специальные подарки и предложения в новом разделе.
          </p>

          <Button
            onClick={goToEvent}
            variant="emerald"
            className="w-full gap-2 h-12 text-base shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            Получить подарки <Gift className="w-4 h-4" />
          </Button>

          <p className="mt-4 text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
            Акция действует до 30 мая
          </p>
        </div>

        <div className="h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
      </DialogContent>
    </Dialog>
  );
}
