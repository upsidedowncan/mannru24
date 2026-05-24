import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getSession, encrypt } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

function isOriginAllowed(db: ReturnType<typeof readDb>, origin: string): boolean {
  return (db.allowedOAuthDomains ?? []).includes(origin);
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  const origin = req.headers.get("origin") ?? "";

  const db = readDb();
  if (!isOriginAllowed(db, origin)) {
    return NextResponse.json({ error: "Origin not authorized", origin }, { status: 403, headers: corsHeaders });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401, headers: corsHeaders });
  }

  const user = db.users.find(u => u.id === session.user.id);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401, headers: corsHeaders });
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: { id: user.id, name: user.name, level: user.level, bonusBalance: user.bonusBalance },
      scope: origin,
    },
    { headers: corsHeaders }
  );
}

export async function POST(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  const origin = req.headers.get("origin") ?? "";

  const db = readDb();
  if (!isOriginAllowed(db, origin)) {
    return NextResponse.json({ error: "Origin not authorized" }, { status: 403, headers: corsHeaders });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: corsHeaders });
  }

  const user = db.users.find(u => u.id === session.user.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401, headers: corsHeaders });
  }

  const token = await encrypt(
    { user: { id: user.id, name: user.name }, scope: origin },
    "1h"
  );

  return NextResponse.json(
    {
      token,
      user: { id: user.id, name: user.name, level: user.level, bonusBalance: user.bonusBalance },
      scope: origin,
      expiresIn: 3600,
    },
    { headers: corsHeaders }
  );
}
