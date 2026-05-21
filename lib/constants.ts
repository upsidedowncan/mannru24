export type CardTier = "bronze" | "silver" | "gold" | "platinum" | "titanium" | "ruby" | "emerald" | "sapphire" | "diamond" | "black" | "obsidian";

export const tierUnlockLevel: Record<CardTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  titanium: 5,
  ruby: 6,
  emerald: 7,
  sapphire: 8,
  diamond: 9,
  black: 10,
  obsidian: 11,
};

export const pageUnlockLevel: Record<string, number> = {
  "/dashboard": 1,
  "/dashboard/cards": 1,
  "/dashboard/history": 2,
  "/dashboard/transfers": 3,
  "/dashboard/bonuses": 4,
  "/dashboard/tasks": 5,
};

export const emojiCodeUnlockLevel = 3;

export const levelThresholds: Record<number, number> = {
  1: 0,
  2: 5,
  3: 15,
  4: 30,
  5: 50,
  6: 75,
  7: 100,
  8: 150,
  9: 200,
  10: 300,
  11: 500,
};

export const maxLevel = 11;
