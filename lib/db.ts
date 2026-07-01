import { writeFile as writeFileAsync, mkdir as mkdirAsync } from "fs/promises";
import { join, dirname } from "path";
import { tierUnlockLevel, pageUnlockLevel, emojiCodeUnlockLevel } from "./constants";

export { tierUnlockLevel, pageUnlockLevel, emojiCodeUnlockLevel };

// In-memory cache of the parsed DB. We hold the parsed object for the
// lifetime of the process and invalidate it on every write. This avoids
// re-parsing the full JSON (and avoiding sync I/O on slow mount points
// like /data on Amvera) on every API request.
let cachedDb: Database | null = null;
// Set to true after the initial async load from disk completes.
let dbLoaded = false;
let pendingWrite: Promise<void> | null = null;

// Kick off the initial load from disk asynchronously at module load. The
// first request will see a freshly-seeded empty DB; once the file loads
// (a few hundred ms on a healthy mount, longer on a slow one), the cache
// is populated and subsequent requests see the real data.
loadFromDisk();

async function loadFromDisk(): Promise<void> {
  try {
    const { readFile } = await import("fs/promises");
    const raw = await readFile(DB_PATH, "utf-8");
    const data = JSON.parse(raw);
    if (data.user && !data.users) {
      cachedDb = {
        users: [{ ...data.user, id: "legacy-user", passwordHash: "" }],
        cards: data.cards.map((c: any) => ({ ...c, userId: "legacy-user" })),
        transactions: data.transactions.map((t: any) => ({ ...t, userId: "legacy-user" })),
        tasks: data.tasks.map((t: any) => ({ ...t, userId: "legacy-user" })),
        bonuses: data.bonuses.map((b: any) => ({ ...b, userId: "legacy-user" })),
        allowedOAuthDomains: [],
        oauthApps: [],
        charityBalance: 0,
      };
      dbLoaded = true;
      return;
    }
    if (!data.allowedOAuthDomains) data.allowedOAuthDomains = [];
    if (!data.oauthApps) data.oauthApps = [];
    if (data.charityBalance === undefined) data.charityBalance = 0;
    cachedDb = data as Database;
    dbLoaded = true;
  } catch {
    // File missing or unreadable. Seed an empty DB and persist it in the
    // background so subsequent server starts have something to load.
    if (!cachedDb) cachedDb = getDefaultDb();
    dbLoaded = true;
    void writeDbInternal(cachedDb);
  }
}

// On Amvera, /data is the persistent mount point.
const DB_PATH = process.env.NODE_ENV === "production" ? "/data/db.json" : join(process.cwd(), "data", "db.json");

export type CardTier = "bronze" | "silver" | "gold" | "platinum" | "titanium" | "ruby" | "emerald" | "sapphire" | "diamond" | "black" | "obsidian" | "rewards";

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
  source?: string;
  description?: string;
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
  lastDailyClaim?: string;
  claimedGifts?: string[];
  mnkHoldings?: number;
  isBanned?: boolean;
  bannedReason?: string;
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

export interface MnkCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface MnkMarket {
  basePrice: number;
  startTime: number;
  candles: MnkCandle[];
  crashed: boolean;
}

export interface CbRatePoint {
  quarter: string;
  rate: number;
}

export interface CbRateState {
  currentRate: number;
  quarter: number;
  year: number;
  history: CbRatePoint[];
}

export interface Database {
  users: UserProfile[];
  cards: Card[];
  transactions: Transaction[];
  tasks: Task[];
  bonuses: Bonus[];
  allowedOAuthDomains: string[];
  oauthApps: OAuthApp[];
  mnkMarket?: MnkMarket;
  charityBalance?: number;
  cbRate?: CbRateState;
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
    charityBalance: 0,
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
  // Fast path: return the in-memory cache. Since this process is the only
  // writer (single-instance Amvera deployment), the cache is always
  // up-to-date after a writeDb() call.
  if (cachedDb) return cachedDb;

  // Cache is still cold (the async load from disk hasn't finished). Return
  // a freshly-seeded default DB so the request can proceed. Subsequent
  // requests after the load completes will see real data.
  cachedDb = getDefaultDb();
  return cachedDb;
}

export function writeDb(db: Database): void {
  // Update the cache immediately so subsequent reads in the same request
  // (or other in-flight requests) don't need to re-read from disk.
  cachedDb = db;

  // If the initial async load hasn't completed yet, don't write — we'd
  // overwrite the real on-disk data with the empty default the request
  // was served from. The cache is still consistent for the current
  // process; the data will be persisted on the next write after load.
  if (!dbLoaded) return;

  // Serialize writes through a single async I/O pipeline so a burst of
  // writes doesn't queue up parallel file writes on a slow mount, and
  // (critically) so we never block the event loop with synchronous I/O.
  const prev = pendingWrite ?? Promise.resolve();
  const next = prev.then(() => writeDbInternal(db));
  pendingWrite = next.then(() => {}, () => {});
}

async function writeDbInternal(db: Database): Promise<void> {
  try {
    const dir = dirname(DB_PATH);
    await mkdirAsync(dir, { recursive: true });
    await writeFileAsync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error(`CRITICAL: Failed to write DB to ${DB_PATH}`, error);
    if (process.env.NODE_ENV === "production" && DB_PATH !== join(process.cwd(), "data", "db.json")) {
      const fallback = join(process.cwd(), "data", "db.json");
      try {
        await mkdirAsync(dirname(fallback), { recursive: true });
        await writeFileAsync(fallback, JSON.stringify(db, null, 2));
      } catch (e) {
        console.error(`Fallback write also failed`, e);
      }
    }
  }
}
