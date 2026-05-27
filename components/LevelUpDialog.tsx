"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MagicWandIcon,
  StarFilledIcon,
  CardStackIcon,
  DashboardIcon,
  Cross2Icon,
  EyeNoneIcon,
  CodeIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import { useProgression } from "@/lib/progression";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  duration: number;
}

const confettiColors = [
  "#FFD700", "#FFA500", "#FF6347", "#FF69B4",
  "#87CEEB", "#98FB98", "#DDA0DD", "#F0E68C",
  "#FF4500", "#00CED1", "#FF1493", "#7B68EE",
];

export function LevelUpDialog() {
  const { levelUps, clearLevelUps } = useProgression();
  const latest = levelUps[levelUps.length - 1];
  const [particles, setParticles] = useState<Particle[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (latest) {
      setShow(true);
      const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.5,
        duration: Math.random() * 1.5 + 1,
      }));
      setParticles(newParticles);
    }
  }, [latest]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => clearLevelUps(), 300);
  };

  if (!latest) return null;

  const isConspiracyLevel = latest.newLevel === 15;

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent
        className={`max-w-sm text-center overflow-hidden border-0 transition-colors duration-1000 ${
          isConspiracyLevel
            ? "bg-black text-red-500 shadow-[0_0_100px_rgba(239,68,68,0.2)]"
            : "bg-gradient-to-b from-background via-background to-background/95"
        }`}
      >
        <DialogTitle className="sr-only">Level Up</DialogTitle>
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 p-1 rounded-full hover:bg-accent transition-colors"
        >
          <Cross2Icon className="w-4 h-4" />
        </button>

        <div className="relative">
          {isConspiracyLevel ? (
            <div className="py-6 space-y-6">
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: [0, 1, 0, 1, 0.5, 1] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="flex justify-center"
               >
                 <EyeNoneIcon className="w-20 h-20 text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
               </motion.div>

               <div className="space-y-2">
                 <motion.h2
                   initial={{ scale: 0.8, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="text-4xl font-black tracking-tighter uppercase italic"
                 >
                   Уровень 15
                 </motion.h2>
                 <motion.p
                   animate={{ opacity: [1, 0.4, 1] }}
                   transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 3 }}
                   className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest"
                 >
                   Инициализация протокола «Капитал»...
                 </motion.p>
               </div>

               <div className="bg-zinc-900/50 border border-red-900/30 p-4 rounded font-mono text-[11px] text-left space-y-1 overflow-hidden">
                 <p className="text-red-800 underline">ВНИМАНИЕ: ДОСТУП ОГРАНИЧЕН</p>
                 <p className="text-zinc-600">{" >> "} Анализ логов кликов завершен.</p>
                 <p className="text-zinc-600">{" >> "} Обнаружена критическая задолженность.</p>
                 <p className="text-zinc-600">{" >> "} Секция «Инвестиции» теперь активна.</p>
                 <p className="text-red-500 animate-pulse">{" >> "} ПРИГОТОВЬТЕСЬ УЗНАТЬ ПРАВДУ.</p>
               </div>

               <Button
                 onClick={handleClose}
                 className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-lg shadow-2xl shadow-red-600/20 group"
               >
                 ПРИНЯТЬ СУДЬБУ <CodeIcon className="ml-2 w-5 h-5 group-hover:animate-pulse" />
               </Button>
            </div>
          ) : (
          <>
          <AnimatePresence mode="popLayout">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: -20, scale: 0, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: [0, 100 + Math.random() * 100],
                  scale: [0, 1, 0.5],
                  rotate: [0, p.rotation, p.rotation * 2],
                  x: [0, (Math.random() - 0.5) * 200],
                }}
                transition={{
                  delay: p.delay,
                  duration: p.duration,
                  ease: "easeOut",
                }}
                className="absolute inset-0 pointer-events-none"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                <div
                  className="rounded-sm"
                  style={{
                    width: p.size,
                    height: p.size * 0.6,
                    backgroundColor: p.color,
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(255,165,0,0.4)]"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-white/20"
            />
            <MagicWandIcon className="w-9 h-9 text-white drop-shadow-lg" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent mb-1">
              Уровень {latest.newLevel}!
            </h2>
            <p className="text-muted-foreground text-sm">Поздравляем! Вы достигли нового уровня</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3 mt-6"
          >
            {latest.unlockedTiers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Новый тариф</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {latest.unlockedTiers.map((tier) => (
                    <motion.div
                      key={tier}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.6 }}
                    >
                      <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                        <CardStackIcon className="w-3.5 h-3.5" />
                        {tier}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {latest.unlockedPages.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Разблокировано</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {latest.unlockedPages.map((page) => (
                    <motion.div
                      key={page}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.7 }}
                    >
                      <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                        <DashboardIcon className="w-3.5 h-3.5" />
                        {page}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6"
          >
            <Button variant="gradient" className="w-full gap-2" onClick={handleClose}>
              Продолжить <StarFilledIcon className="w-4 h-4" />
            </Button>
          </motion.div>
          </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
