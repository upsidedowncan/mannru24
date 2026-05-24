import { NextResponse } from "next/server";
import { readDb, writeDb, calculateLevel, logClick } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const db = readDb();
  const user = db.users.find(u => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404, headers: corsHeaders });

  const { level, currentXp, nextXp } = calculateLevel(user.xp);
  logClick(db, session.user.id, "Просмотр профиля");
  writeDb(db);
  return NextResponse.json({ ...user, currentXp, nextXp }, { headers: corsHeaders });
}

export async function PATCH(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const db = readDb();
  const userIdx = db.users.findIndex(u => u.id === session.user.id);
  if (userIdx === -1) return NextResponse.json({ error: "User not found" }, { status: 404, headers: corsHeaders });

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
    return NextResponse.json({ ...db.users[userIdx], currentXp, nextXp, levelUps }, { headers: corsHeaders });
  }

  db.users[userIdx] = { ...db.users[userIdx], ...body };
  logClick(db, session.user.id, "Обновление профиля");
  writeDb(db);
  const { level, currentXp, nextXp } = calculateLevel(db.users[userIdx].xp);
  return NextResponse.json({ ...db.users[userIdx], currentXp, nextXp }, { headers: corsHeaders });
}
