import { NextResponse } from "next/server";
import { readDb, writeDb, calculateLevel } from "@/lib/db";
import { getSession } from "@/lib/auth";

const DEV_PHONE = "+79268911629";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDb();
  const user = db.users.find(u => u.id === session.user.id);

  if (!user || user.phone !== DEV_PHONE) {
    return NextResponse.json({ error: "Access denied. Target: " + DEV_PHONE }, { status: 403 });
  }

  const body = await req.json();
  const { type, amount, cardId } = body;

  if (type === "xp") {
    user.xp += parseInt(amount);
    const { level } = calculateLevel(user.xp);
    user.level = level;
  } else if (type === "money" && cardId) {
    const card = db.cards.find(c => c.id === cardId && c.userId === user.id);
    if (card) card.balance += parseInt(amount);
  } else if (type === "level") {
    // Force a level
    const targetLevel = parseInt(amount);
    // XP for level N: 100 * (N-1)*N / 2 is the OLD formula.
    // New formula is recursive. Let's just approximate or set precisely.
    let totalXp = 0;
    let req = 5;
    for (let i = 1; i < targetLevel; i++) {
        totalXp += req;
        req = Math.round(req * 1.5);
    }
    user.xp = totalXp;
    user.level = targetLevel;
  }

  writeDb(db);
  return NextResponse.json({ success: true, user });
}
