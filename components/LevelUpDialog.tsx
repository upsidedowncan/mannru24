"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RiMagicLine,
  RiStarFill,
  RiStackLine,
  RiDashboardLine,
  RiCloseLine,
  RiEyeOffLine,
  RiCodeLine,
} from "react-icons/ri";
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

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-sm text-center overflow-hidden border-0 bg-gradient-to-b from-background via-background to-background/95"
      >
        <DialogTitle className="sr-only">Level Up</DialogTitle>
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 p-1 rounded-full hover:bg-accent transition-colors"
        >
          <RiCloseLine className="w-4 h-4" />
        </button>

        <div className="relative">
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
            <RiMagicLine className="w-9 h-9 text-white drop-shadow-lg" />
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
                        <RiStackLine className="w-3.5 h-3.5" />
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
                        <RiDashboardLine className="w-3.5 h-3.5" />
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
              Продолжить <RiStarFill className="w-4 h-4" />
            </Button>
          </motion.div>
          </>
        </div>
      </DialogContent>
    </Dialog>
  );
}
