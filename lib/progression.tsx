"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";

interface LevelUpEvent {
  newLevel: number;
  unlockedPages: string[];
  unlockedTiers: string[];
}

interface PreviewUser {
  id: string;
  name: string;
  level: number;
  xp: number;
  currentXp: number;
  nextXp: number;
  bonusBalance: number;
}

interface ProgressionContextType {
  level: number;
  xp: number;
  currentXp: number;
  nextXp: number;
  levelUps: LevelUpEvent[];
  isReadOnly: boolean;
  previewUser: PreviewUser | null;
  isBanned: boolean;
  addXp: (amount: number) => Promise<void>;
  triggerLevelUps: (levelUps: number[], level: number, xp: number, currentXp: number, nextXp: number) => void;
  clearLevelUps: () => void;
  refresh: () => Promise<void>;
  enterPreview: (userData: PreviewUser) => void;
  exitPreview: () => void;
}

const ProgressionContext = createContext<ProgressionContextType | null>(null);

export function ProgressionProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [currentXp, setCurrentXp] = useState(0);
  const [nextXp, setNextXp] = useState(5);
  const [levelUps, setLevelUps] = useState<LevelUpEvent[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [previewUser, setPreviewUser] = useState<PreviewUser | null>(null);
  const [isBanned, setIsBanned] = useState(false);

  // Store admin's own data to restore on exit
  const adminData = useRef<{ level: number; xp: number; currentXp: number; nextXp: number } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/user");
      if (!res.ok) return;
      const data = await res.json();
      if (data.isBanned) {
        setIsBanned(true);
        // Clear session so they can't navigate back
        fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        return;
      }
      adminData.current = { level: data.level, xp: data.xp, currentXp: data.currentXp, nextXp: data.nextXp };
      // Only update displayed data if not in preview mode
      if (!isReadOnly) {
        setLevel(data.level);
        setXp(data.xp);
        setCurrentXp(data.currentXp);
        setNextXp(data.nextXp);
      }
    } catch {
      // ignore
    }
  }, [isReadOnly]);

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
    if (!isReadOnly) {
      setLevel(data.level);
      setXp(data.xp);
      setCurrentXp(data.currentXp);
      setNextXp(data.nextXp);
    }
    adminData.current = { level: data.level, xp: data.xp, currentXp: data.currentXp, nextXp: data.nextXp };
    if (data.levelUps?.length) {
      const newUps: LevelUpEvent[] = data.levelUps.map((lvl: number) => ({
        newLevel: lvl,
        unlockedPages: getUnlockedPages(lvl),
        unlockedTiers: getUnlockedTiers(lvl),
      }));
      setLevelUps((prev) => [...prev, ...newUps]);
    }
  }, [isReadOnly]);

  const clearLevelUps = useCallback(() => setLevelUps([]), []);

  const triggerLevelUps = useCallback((levelUps: number[], newLevel: number, newXp: number, newCurrentXp: number, newNextXp: number) => {
    adminData.current = { level: newLevel, xp: newXp, currentXp: newCurrentXp, nextXp: newNextXp };
    if (!isReadOnly) {
      setLevel(newLevel);
      setXp(newXp);
      setCurrentXp(newCurrentXp);
      setNextXp(newNextXp);
    }
    if (levelUps?.length) {
      const newUps: LevelUpEvent[] = levelUps.map((lvl: number) => ({
        newLevel: lvl,
        unlockedPages: getUnlockedPages(lvl),
        unlockedTiers: getUnlockedTiers(lvl),
      }));
      setLevelUps((prev) => [...prev, ...newUps]);
    }
  }, [isReadOnly]);

  const enterPreview = useCallback((userData: PreviewUser) => {
    setPreviewUser(userData);
    setIsReadOnly(true);
    setLevel(userData.level);
    setXp(userData.xp);
    setCurrentXp(userData.currentXp);
    setNextXp(userData.nextXp);
  }, []);

  const exitPreview = useCallback(() => {
    setPreviewUser(null);
    setIsReadOnly(false);
    if (adminData.current) {
      setLevel(adminData.current.level);
      setXp(adminData.current.xp);
      setCurrentXp(adminData.current.currentXp);
      setNextXp(adminData.current.nextXp);
    }
  }, []);

  return (
    <ProgressionContext.Provider value={{
      level, xp, currentXp, nextXp, levelUps,
      isReadOnly, previewUser, isBanned,
      addXp, triggerLevelUps, clearLevelUps, refresh,
      enterPreview, exitPreview,
    }}>
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
