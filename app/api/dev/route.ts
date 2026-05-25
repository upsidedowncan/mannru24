import { NextResponse } from "next/server";
import { readDb, writeDb, calculateLevel, type UserProfile } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

const DEV_UUID = "62734945-0f34-4ae1-b6e2-1e2939fb09d3";
const DEV_ROLE = {
  role: "developer",
  permissions: ["manage_oauth_domains", "read_db", "bypass_limits"] as const,
};

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const db = readDb();
  const user = db.users.find(u => u.id === session.user.id);

  if (!user || user.id !== DEV_UUID) {
    return NextResponse.json({ error: "Forbidden", role: null }, { status: 403, headers: corsHeaders });
  }

  const users = db.users.map((u: UserProfile) => {
    const { passwordHash, ...safeUser } = u;
    const { level, currentXp, nextXp } = calculateLevel(u.xp);
    return { ...safeUser, level, currentXp, nextXp };
  });

  return NextResponse.json(
    { ...DEV_ROLE, user: { id: user.id, name: user.name, level: user.level }, users },
    { headers: corsHeaders }
  );
}

export async function PATCH(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const db = readDb();
  const requester = db.users.find(u => u.id === session.user.id);
  if (!requester || requester.id !== DEV_UUID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
  }

  const body = await req.json();
  const { type, userId, bannedReason } = body;

  const target = db.users.find(u => u.id === userId);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404, headers: corsHeaders });
  }

  if (type === "ban") {
    target.isBanned = true;
    target.bannedReason = bannedReason || "Нарушение правил коалиции MANNHAXORS";
  } else if (type === "unban") {
    target.isBanned = false;
    target.bannedReason = undefined;
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400, headers: corsHeaders });
  }

  writeDb(db);
  const { passwordHash, ...safeUser } = target;
  return NextResponse.json({ success: true, user: safeUser }, { headers: corsHeaders });
}

export async function POST(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const db = readDb();
  const user = db.users.find(u => u.id === session.user.id);

  if (!user || user.id !== DEV_UUID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
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
    const targetLevel = parseInt(amount);
    let totalXp = 0;
    let xpReq = 5;
    for (let i = 1; i < targetLevel; i++) {
      totalXp += xpReq;
      xpReq = Math.round(xpReq * 1.5);
    }
    user.xp = totalXp;
    user.level = targetLevel;
  }

  writeDb(db);
  return NextResponse.json({ success: true, user, ...DEV_ROLE }, { headers: corsHeaders });
}
