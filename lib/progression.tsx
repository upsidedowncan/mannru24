"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";

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
  isReadOnly: boolean;
  isBanned: boolean;
  previewUserId: string | null;
  addXp: (amount: number) => Promise<void>;
  triggerLevelUps: (levelUps: number[], level: number, xp: number, currentXp: number, nextXp: number) => void;
  clearLevelUps: () => void;
  refresh: () => Promise<void>;
  enterPreview: (userId: string, userData: { level: number; xp: number; currentXp: number; nextXp: number }) => void;
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
  const [isBanned, setIsBanned] = useState(false);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const savedDataRef = useRef<{ level: number; xp: number; currentXp: number; nextXp: number } | null>(null);
  const isBannedRef = useRef(false);
  const previewUserIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (isBannedRef.current || previewUserIdRef.current) return;
    const res = await fetch("/api/user");
    if (!res.ok) return;
    const data = await res.json();
    if (data.isBanned) {
      isBannedRef.current = true;
      setIsBanned(true);
      fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      return;
    }
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
    if (isReadOnly) return;
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
  }, [isReadOnly]);

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

  const enterPreview = useCallback((userId: string, userData: { level: number; xp: number; currentXp: number; nextXp: number }) => {
    savedDataRef.current = { level, xp, currentXp, nextXp };
    previewUserIdRef.current = userId;
    setPreviewUserId(userId);
    setIsReadOnly(true);
    setLevel(userData.level);
    setXp(userData.xp);
    setCurrentXp(userData.currentXp);
    setNextXp(userData.nextXp);
  }, [level, xp, currentXp, nextXp]);

  const exitPreview = useCallback(() => {
    previewUserIdRef.current = null;
    setPreviewUserId(null);
    setIsReadOnly(false);
    if (savedDataRef.current) {
      setLevel(savedDataRef.current.level);
      setXp(savedDataRef.current.xp);
      setCurrentXp(savedDataRef.current.currentXp);
      setNextXp(savedDataRef.current.nextXp);
      savedDataRef.current = null;
    }
    refresh();
  }, [refresh]);

  return (
    <ProgressionContext.Provider value={{ level, xp, currentXp, nextXp, levelUps, isReadOnly, isBanned, previewUserId, addXp, triggerLevelUps, clearLevelUps, refresh, enterPreview, exitPreview }}>
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
