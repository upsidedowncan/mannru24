import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { tierUnlockLevel, pageUnlockLevel, emojiCodeUnlockLevel } from "./constants";

export { tierUnlockLevel, pageUnlockLevel, emojiCodeUnlockLevel };

const DB_PATH = join(process.cwd(), "data", "db.json");

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
}

interface Database {
  users: UserProfile[];
  cards: Card[];
  transactions: Transaction[];
  tasks: Task[];
  bonuses: Bonus[];
}

function getDefaultDb(): Database {
  return {
    users: [],
    cards: [],
    transactions: [],
    tasks: [],
    bonuses: [],
  };
}

export function calculateLevel(xp: number): { level: number; currentXp: number; nextXp: number } {
  // Formula: XP = Level * 100 for NEXT level.
  // Level 1: 0-99 XP
  // Level 2: 100-299 XP (2 * 100 = 200 needed for level 3)
  // Wait, let's use a simpler one: Level = floor(sqrt(xp/100)) + 1 ?
  // User asked for: XP = Level * 100 for each next level.
  // Lvl 1 -> 2: 100 XP
  // Lvl 2 -> 3: 200 XP
  // Lvl 3 -> 4: 300 XP
  // Total XP for Level N: sum_{i=1}^{N-1} (i * 100) = 100 * (N-1)*N / 2

  let level = 1;
  while (true) {
    const xpForNext = level * 100;
    const totalXpForNext = (level * (level + 1) / 2) * 100;
    if (xp < totalXpForNext) break;
    level++;
  }

  const totalXpForCurrent = ((level - 1) * level / 2) * 100;
  const currentXp = xp - totalXpForCurrent;
  const nextXp = level * 100;

  return { level, currentXp, nextXp };
}

export function addXp(db: Database, userId: string, amount: number): number[] {
  const user = db.users.find(u => u.id === userId);
  if (!user) return [];

  const oldLevel = user.level;
  user.xp += amount;
  const { level } = calculateLevel(user.xp);
  user.level = level;

  if (level > oldLevel) {
    return Array.from({ length: level - oldLevel }, (_, i) => oldLevel + i + 1);
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
      };
    }
    return data as Database;
  } catch (e) {
    return getDefaultDb();
  }
}

export function writeDb(db: Database): void {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
