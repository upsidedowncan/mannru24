"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

interface LevelUpEvent {
  newLevel: number;
  unlockedPages: string[];
  unlockedTiers: string[];
}

interface ProgressionContextType {
  level: number;
  xp: number;
  currentXp: number;
  nextXp: number;
  levelUps: LevelUpEvent[];
  addXp: (amount: number) => Promise<void>;
  triggerLevelUps: (levelUps: number[], level: number, xp: number, currentXp: number, nextXp: number) => void;
  clearLevelUps: () => void;
  refresh: () => Promise<void>;
}

const ProgressionContext = createContext<ProgressionContextType | null>(null);

export function ProgressionProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [currentXp, setCurrentXp] = useState(0);
  const [nextXp, setNextXp] = useState(5);
  const [levelUps, setLevelUps] = useState<LevelUpEvent[]>([]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/user");
    const data = await res.json();
    setLevel(data.level);
    setXp(data.xp);
    setCurrentXp(data.currentXp);
    setNextXp(data.nextXp);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => { refresh(); }, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const addXp = useCallback(async (amount: number) => {
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xpAdd: amount }),
    });
    const data = await res.json();
    setLevel(data.level);
    setXp(data.xp);
    setCurrentXp(data.currentXp);
    setNextXp(data.nextXp);
    if (data.levelUps?.length) {
      const newUps: LevelUpEvent[] = data.levelUps.map((lvl: number) => ({
        newLevel: lvl,
        unlockedPages: getUnlockedPages(lvl),
        unlockedTiers: getUnlockedTiers(lvl),
      }));
      setLevelUps((prev) => [...prev, ...newUps]);
    }
  }, []);

  const clearLevelUps = useCallback(() => setLevelUps([]), []);

  const triggerLevelUps = useCallback((levelUps: number[], newLevel: number, newXp: number, newCurrentXp: number, newNextXp: number) => {
    setLevel(newLevel);
    setXp(newXp);
    setCurrentXp(newCurrentXp);
    setNextXp(newNextXp);
    if (levelUps?.length) {
      const newUps: LevelUpEvent[] = levelUps.map((lvl: number) => ({
        newLevel: lvl,
        unlockedPages: getUnlockedPages(lvl),
        unlockedTiers: getUnlockedTiers(lvl),
      }));
      setLevelUps((prev) => [...prev, ...newUps]);
    }
  }, []);

  return (
    <ProgressionContext.Provider value={{ level, xp, currentXp, nextXp, levelUps, addXp, triggerLevelUps, clearLevelUps, refresh }}>
      {children}
    </ProgressionContext.Provider>
  );
}

export function useProgression() {
  const ctx = useContext(ProgressionContext);
  if (!ctx) throw new Error("useProgression must be used within ProgressionProvider");
  return ctx;
}

import { pageUnlockLevel, tierUnlockLevel } from "./constants";

function getUnlockedPages(level: number): string[] {
  const pages: string[] = [];
  const map: Record<string, string> = {
    "/dashboard/history": "История",
    "/dashboard/transfers": "Переводы",
    "/dashboard/bonuses": "Бонусы",
    "/dashboard/tasks": "Задания",
    "/dashboard/investments": "Инвестиции",
  };

  for (const [path, lvl] of Object.entries(pageUnlockLevel)) {
    if (lvl === level && map[path]) pages.push(map[path]);
  }
  return pages;
}

function getUnlockedTiers(level: number): string[] {
  const tiers: string[] = [];
  for (const [tier, lvl] of Object.entries(tierUnlockLevel)) {
    if (lvl === level) tiers.push(tier.charAt(0).toUpperCase() + tier.slice(1));
  }
  return tiers;
}
