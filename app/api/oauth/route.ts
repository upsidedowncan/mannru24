import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getSession, encrypt } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

function isDomainAllowed(db: ReturnType<typeof readDb>, origin: string | null): boolean {
  if (!origin) return false;
  return (db.allowedOAuthDomains ?? []).includes(origin);
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const origin = req.headers.get("origin");
  const db = readDb();

  if (!isDomainAllowed(db, origin)) {
    return NextResponse.json({ error: "Domain not authorized for OAuth" }, { status: 403, headers: corsHeaders });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ authorized: false }, { headers: corsHeaders });

  const user = db.users.find(u => u.id === session.user.id);
  if (!user) return NextResponse.json({ authorized: false }, { headers: corsHeaders });

  return NextResponse.json(
    { authorized: true, user: { id: user.id, name: user.name, level: user.level } },
    { headers: corsHeaders }
  );
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const origin = req.headers.get("origin");
  const db = readDb();

  if (!isDomainAllowed(db, origin)) {
    return NextResponse.json({ error: "Domain not authorized for OAuth" }, { status: 403, headers: corsHeaders });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: corsHeaders });

  const user = db.users.find(u => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404, headers: corsHeaders });

  const token = await encrypt({
    user: { id: user.id, name: user.name },
    scope: "oauth",
    audience: origin,
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });

  return NextResponse.json(
    {
      access_token: token,
      token_type: "Bearer",
      expires_in: 3600,
      user: { id: user.id, name: user.name, level: user.level },
    },
    { headers: corsHeaders }
  );
}
