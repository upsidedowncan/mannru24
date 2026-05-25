import { NextResponse } from "next/server";
import { readDb, writeDb, calculateLevel } from "@/lib/db";
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

  return NextResponse.json(
    { ...DEV_ROLE, user: { id: user.id, name: user.name, level: user.level } },
    { headers: corsHeaders }
  );
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

export async function PATCH(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const db = readDb();
  const requestingUser = db.users.find(u => u.id === session.user.id);
  if (!requestingUser || requestingUser.id !== DEV_UUID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
  }

  const body = await req.json();
  const { action, userId, reason } = body;

  const targetUser = db.users.find(u => u.id === userId);
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404, headers: corsHeaders });
  }

  if (action === "ban") {
    targetUser.isBanned = true;
    targetUser.bannedReason = reason || "Нарушение правил коалиции MANNHAXORS";
  } else if (action === "unban") {
    targetUser.isBanned = false;
    targetUser.bannedReason = undefined;
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400, headers: corsHeaders });
  }

  writeDb(db);
  return NextResponse.json({ success: true, user: { id: targetUser.id, name: targetUser.name, isBanned: targetUser.isBanned } }, { headers: corsHeaders });
}
