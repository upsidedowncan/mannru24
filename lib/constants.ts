export type CardTier = "bronze" | "silver" | "gold" | "platinum" | "titanium" | "ruby" | "emerald" | "sapphire" | "diamond" | "black" | "obsidian" | "rewards";

export const tierUnlockLevel: Record<CardTier, number> = {
  bronze: 1,
  rewards: 1,
  silver: 3,
  gold: 6,
  platinum: 10,
  titanium: 15,
  ruby: 20,
  emerald: 25,
  sapphire: 30,
  diamond: 35,
  black: 40,
  obsidian: 50,
};

export const pageUnlockLevel: Record<string, number> = {
  "/dashboard": 1,
  "/dashboard/cards": 1,
  "/dashboard/history": 3,
  "/dashboard/transfers": 5,
  "/dashboard/bonuses": 10,
  "/dashboard/tasks": 2,
  "/dashboard/investments": 15,
  "/dashboard/games": 1,
  "/dashboard/lariek": 1,
};

export const emojiCodeUnlockLevel = 5;

// Formula: XP for level L = (L-1) * 100
// Total XP to REACH level L = Sum of XP for levels 1 to L-1
export const getXpForLevel = (level: number) => (level - 1) * 100;

export const getTotalXpToReachLevel = (level: number) => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += i * 100;
  }
  return total;
};
