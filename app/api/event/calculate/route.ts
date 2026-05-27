import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isEventActive } from "@/lib/events";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isEventActive("kurban")) {
    return NextResponse.json({ error: "Event is not active" }, { status: 403 });
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const totalClaimed = user.claimedGifts?.includes("kurban-2026") || false;

  // Simple deterministic calculation for GET to avoid hitting AI on every page load
  // But let's try to be consistent with the claim logic
  // Level < 5 -> ~12-15 sheep
  // Level >= 5 -> ~2 sheep

  let sheepCount = user.level < 5 ? 12 : 2;
  // Add some variety based on level and XP
  sheepCount += Math.floor(user.level / 10);

  const mrReward = sheepCount * 500;
  const xpReward = 0;

  return NextResponse.json({
    sheepCount,
    mrReward,
    xpReward,
    totalClaimed
  });
}
