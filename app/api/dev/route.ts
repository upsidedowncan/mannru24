import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, calculateLevel } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

const DEV_UUID = "62734945-0f34-4ae1-b6e2-1e2939fb09d3";
const DEV_PERMISSIONS = ["manage_oauth_domains", "read_db", "bypass_limits"];

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  if (session.user.id !== DEV_UUID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
  }

  return NextResponse.json(
    { role: "developer", permissions: DEV_PERMISSIONS, userId: session.user.id },
    { headers: corsHeaders }
  );
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  if (session.user.id !== DEV_UUID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
  }

  const db = readDb();
  const user = db.users.find(u => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404, headers: corsHeaders });

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
  return NextResponse.json({ success: true, user }, { headers: corsHeaders });
}
