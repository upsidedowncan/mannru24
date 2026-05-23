import { calculateLevel } from "./lib/db";

const testXps = [0, 5, 12, 13, 25, 45, 100, 500];
testXps.forEach(xp => {
  const result = calculateLevel(xp);
  console.log(`XP: ${xp} -> Level: ${result.level}, Current: ${result.currentXp}, NextReq: ${result.nextXp}`);
});
