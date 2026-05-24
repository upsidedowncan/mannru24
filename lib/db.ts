import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { tierUnlockLevel, pageUnlockLevel, emojiCodeUnlockLevel } from "./constants";

export { tierUnlockLevel, pageUnlockLevel, emojiCodeUnlockLevel };

// On Amvera, /data is the persistent mount point.
const DB_PATH = process.env.NODE_ENV === "production" ? "/data/db.json" : join(process.cwd(), "data", "db.json");

export type CardTier = "bronze" | "silver" | "gold" | "platinum" | "titanium" | "ruby" | "emerald" | "sapphire" | "diamond" | "black" | "obsidian";

export interface Card {
  id: string;
  userId: string;
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
  userId: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  cardId?: string;
  emojiCode?: string | null;
}

export interface Task {
  id: string;
  userId: string;
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
  userId: string;
  title: string;
  description: string;
  points: number;
  category: string;
  expires: string;
  activated: boolean;
}

export interface ClickRecord {
  timestamp: string;
  action: string;
}

export interface UserProfile {
  id: string;
  name: string;
  passwordHash: string;
  phone: string;
  bonusBalance: number;
  totalEarned: number;
  totalSpent: number;
  streak: number;
  level: number;
  xp: number;
  clickHistory: ClickRecord[];
}

export interface OAuthApp {
  id: string;
  clientId: string;
  name: string;
  redirectUrl: string;
  iconUrl?: string;
  scopes: string[];
  createdAt: string;
}

export interface Database {
  users: UserProfile[];
  cards: Card[];
  transactions: Transaction[];
  tasks: Task[];
  bonuses: Bonus[];
  allowedOAuthDomains: string[];
  oauthApps: OAuthApp[];
}

function getDefaultDb(): Database {
  return {
    users: [],
    cards: [],
    transactions: [],
    tasks: [],
    bonuses: [],
    allowedOAuthDomains: [],
    oauthApps: [],
  };
}

export function calculateLevel(xp: number): { level: number; currentXp: number; nextXp: number } {
  // Required XP for next level increases by 1.5x, starting from 5 XP for Lvl 2
  let level = 1;
  let currentTotal = 0;
  let requiredForNext = 5;

  while (xp >= currentTotal + requiredForNext) {
    currentTotal += requiredForNext;
    level++;
    requiredForNext = Math.round(requiredForNext * 1.5);
  }

  return {
    level,
    currentXp: xp - currentTotal,
    nextXp: requiredForNext,
  };
}

export function logClick(db: Database, userId: string, action: string): void {
  const user = db.users.find(u => u.id === userId);
  if (!user) return;
  if (!user.clickHistory) user.clickHistory = [];
  user.clickHistory.push({
    timestamp: new Date().toISOString(),
    action,
  });
  // Keep history reasonable
  if (user.clickHistory.length > 100) user.clickHistory.shift();
}

export function addXp(db: Database, userId: string, amount: number): number[] {
  const user = db.users.find((u) => u.id === userId);
  if (!user) return [];

  const oldLevel = user.level;
  user.xp += amount;
  const { level } = calculateLevel(user.xp);

  if (level > oldLevel) {
    const levelUps: number[] = [];
    for (let l = oldLevel + 1; l <= level; l++) {
      levelUps.push(l);
      // Reward: Level * 50 bonus MR
      const reward = l * 50;
      user.bonusBalance += reward;
      user.totalEarned += reward;
    }
    user.level = level;
    return levelUps;
  }
  return [];
}

export function readDb(): Database {
  if (!existsSync(DB_PATH)) {
    const defaultDb = getDefaultDb();
    writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
  const raw = readFileSync(DB_PATH, "utf-8");
  try {
    const data = JSON.parse(raw);
    // Migration if old format
    if (data.user && !data.users) {
      return {
        users: [{ ...data.user, id: "legacy-user", passwordHash: "" }],
        cards: data.cards.map((c: any) => ({ ...c, userId: "legacy-user" })),
        transactions: data.transactions.map((t: any) => ({ ...t, userId: "legacy-user" })),
        tasks: data.tasks.map((t: any) => ({ ...t, userId: "legacy-user" })),
        bonuses: data.bonuses.map((b: any) => ({ ...b, userId: "legacy-user" })),
        allowedOAuthDomains: [],
      };
    }
    if (!data.allowedOAuthDomains) data.allowedOAuthDomains = [];
    if (!data.oauthApps) data.oauthApps = [];
    return data as Database;
  } catch (e) {
    return getDefaultDb();
  }
}

export function writeDb(db: Database): void {
  try {
    const dir = dirname(DB_PATH);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log(`DB successfully written to ${DB_PATH}`);
  } catch (error) {
    console.error(`CRITICAL: Failed to write DB to ${DB_PATH}`, error);
    // Fallback to local path if production path fails
    if (process.env.NODE_ENV === "production" && DB_PATH !== join(process.cwd(), "data", "db.json")) {
      const fallback = join(process.cwd(), "data", "db.json");
      try {
        const fallbackDir = dirname(fallback);
        if (!existsSync(fallbackDir)) mkdirSync(fallbackDir, { recursive: true });
        writeFileSync(fallback, JSON.stringify(db, null, 2));
        console.log(`Fallback write to ${fallback} successful`);
      } catch (e) {
        console.error(`Fallback write also failed`, e);
      }
    }
  }
}
