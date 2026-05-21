import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { tierUnlockLevel, pageUnlockLevel, emojiCodeUnlockLevel, levelThresholds, maxLevel } from "./constants";

export { tierUnlockLevel, pageUnlockLevel, emojiCodeUnlockLevel, levelThresholds, maxLevel };

const DB_PATH = join(process.cwd(), "data", "db.json");

export type CardTier = "bronze" | "silver" | "gold" | "platinum" | "titanium" | "ruby" | "emerald" | "sapphire" | "diamond" | "black" | "obsidian";

export interface Card {
  id: string;
  tier: CardTier;
  number: string;
  holder: string;
  balance: number;
  expiry: string;
  createdAt: string;
  emojiCode?: string | null;
}

export interface Transaction {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  cardId?: string;
  emojiCode?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: string;
  rewardPoints: number;
  progress: number;
  total: number;
  type: "daily" | "weekly" | "special";
  completed: boolean;
}

export interface Bonus {
  id: string;
  title: string;
  description: string;
  points: number;
  category: string;
  expires: string;
  activated: boolean;
}

export interface UserProfile {
  name: string;
  phone: string;
  bonusBalance: number;
  totalEarned: number;
  totalSpent: number;
  streak: number;
  level: number;
  xp: number;
}

export const emojiTiers: CardTier[] = ["gold", "platinum", "titanium", "ruby", "emerald", "sapphire", "diamond", "black", "obsidian"];

interface Database {
  cards: Card[];
  transactions: Transaction[];
  tasks: Task[];
  bonuses: Bonus[];
  user: UserProfile;
}

function getDefaultDb(): Database {
  return {
    cards: [],
    transactions: [],
    tasks: [],
    bonuses: [],
    user: {
      name: "Александр",
      phone: "",
      bonusBalance: 0,
      totalEarned: 0,
      totalSpent: 0,
      streak: 0,
      level: 1,
      xp: 0,
    },
  };
}

function calculateLevel(xp: number): { level: number; currentXp: number; nextXp: number } {
  let level = 1;
  for (let i = maxLevel; i >= 1; i--) {
    if (xp >= levelThresholds[i]) {
      level = i;
      break;
    }
  }
  const currentXp = xp - levelThresholds[level];
  const nextXp = level < maxLevel ? levelThresholds[level + 1] - levelThresholds[level] : 0;
  return { level, currentXp, nextXp };
}

function addXp(db: Database, amount: number): number[] {
  const oldLevel = db.user.level;
  db.user.xp += amount;
  const { level } = calculateLevel(db.user.xp);
  db.user.level = level;
  if (level > oldLevel) {
    return Array.from({ length: level - oldLevel }, (_, i) => oldLevel + i + 1);
  }
  return [];
}

function readDb(): Database {
  if (!existsSync(DB_PATH)) {
    const defaultDb = getDefaultDb();
    writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
  const raw = readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as Database;
}

function writeDb(db: Database): void {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export { readDb, writeDb, calculateLevel, addXp };
