import { NextResponse } from "next/server";
import { readDb, writeDb, logClick, addXp } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isEventActive } from "@/lib/events";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isEventActive("kurban")) {
    return NextResponse.json({ error: "Event is not active" }, { status: 403 });
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!user.claimedGifts) user.claimedGifts = [];

  if (user.claimedGifts.includes("kurban-2026")) {
    return NextResponse.json({ error: "Gift already claimed" }, { status: 400 });
  }

  // Award gift
  const giftAmount = 500;
  const xpAmount = 10;

  user.bonusBalance += giftAmount;
  user.totalEarned += giftAmount;
  user.claimedGifts.push("kurban-2026");

  const levelUps = addXp(db, user.id, xpAmount);

  logClick(db, user.id, "Получение подарка Курбан-байрам");
  writeDb(db);

  return NextResponse.json({
    message: "Gift claimed successfully",
    giftAmount,
    xpAmount,
    levelUps,
  });
}
