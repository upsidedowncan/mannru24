import { NextResponse } from "next/server";
import { readDb, writeDb, calculateLevel } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDb();
  const user = db.users.find(u => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { level, currentXp, nextXp } = calculateLevel(user.xp);
  return NextResponse.json({ ...user, currentXp, nextXp });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDb();
  const userIdx = db.users.findIndex(u => u.id === session.user.id);
  if (userIdx === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();

  if (body.xpAdd) {
    const oldLevel = db.users[userIdx].level;
    db.users[userIdx].xp += body.xpAdd;
    const { level } = calculateLevel(db.users[userIdx].xp);
    db.users[userIdx].level = level;
    const levelUps: number[] = [];
    for (let i = oldLevel + 1; i <= level; i++) {
      levelUps.push(i);
    }
    writeDb(db);
    const { currentXp, nextXp } = calculateLevel(db.users[userIdx].xp);
    return NextResponse.json({ ...db.users[userIdx], currentXp, nextXp, levelUps });
  }

  db.users[userIdx] = { ...db.users[userIdx], ...body };
  writeDb(db);
  const { level, currentXp, nextXp } = calculateLevel(db.users[userIdx].xp);
  return NextResponse.json({ ...db.users[userIdx], currentXp, nextXp });
}
