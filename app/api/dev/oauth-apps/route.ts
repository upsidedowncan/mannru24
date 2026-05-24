import { NextResponse } from "next/server";
import { readDb, writeDb, Database, OAuthApp } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";
import { randomUUID } from "crypto";

const DEV_UUID = "62734945-0f34-4ae1-b6e2-1e2939fb09d3";

type DevCheck =
  | { ok: true; db: Database; corsHeaders: Record<string, string> }
  | { ok: false; response: NextResponse };

async function requireDev(req: Request): Promise<DevCheck> {
  const corsHeaders = getCorsHeaders(req);
  const session = await getSession();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders }) };
  }

  const db = readDb();
  const user = db.users.find(u => u.id === session.user.id);
  if (!user || user.id !== DEV_UUID) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders }) };
  }

  return { ok: true, db, corsHeaders };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: Request) {
  const check = await requireDev(req);
  if (!check.ok) return check.response;
  const { db, corsHeaders } = check;
  return NextResponse.json({ apps: db.oauthApps }, { headers: corsHeaders });
}

export async function POST(req: Request) {
  const check = await requireDev(req);
  if (!check.ok) return check.response;
  const { db, corsHeaders } = check;

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const icon = typeof body.icon === "string" ? body.icon.trim() : "";
  const scopes = Array.isArray(body.scopes)
    ? body.scopes.filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0).map((s: string) => s.trim())
    : [];

  if (!name || !url) {
    return NextResponse.json({ error: "name and url are required" }, { status: 400, headers: corsHeaders });
  }

  const app: OAuthApp = {
    id: randomUUID(),
    name,
    url,
    icon,
    scopes,
    createdAt: new Date().toISOString(),
  };

  db.oauthApps.push(app);
  writeDb(db);

  return NextResponse.json({ success: true, app, apps: db.oauthApps }, { headers: corsHeaders });
}

export async function DELETE(req: Request) {
  const check = await requireDev(req);
  if (!check.ok) return check.response;
  const { db, corsHeaders } = check;

  const { id } = await req.json();
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing id" }, { status: 400, headers: corsHeaders });
  }

  db.oauthApps = db.oauthApps.filter(a => a.id !== id);
  writeDb(db);

  return NextResponse.json({ success: true, apps: db.oauthApps }, { headers: corsHeaders });
}
