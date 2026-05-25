import { NextResponse } from "next/server";
import { readDb, calculateLevel } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

const DEV_UUID = "62734945-0f34-4ae1-b6e2-1e2939fb09d3";

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
  const requestingUser = db.users.find(u => u.id === session.user.id);
  if (!requestingUser || requestingUser.id !== DEV_UUID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
  }

  const users = db.users.map(u => {
    const { currentXp, nextXp } = calculateLevel(u.xp);
    return {
      id: u.id,
      name: u.name,
      phone: u.phone,
      level: u.level,
      xp: u.xp,
      currentXp,
      nextXp,
      bonusBalance: u.bonusBalance,
      totalEarned: u.totalEarned,
      totalSpent: u.totalSpent,
      isBanned: u.isBanned || false,
      bannedReason: u.bannedReason || null,
    };
  });

  return NextResponse.json(users, { headers: corsHeaders });
}
