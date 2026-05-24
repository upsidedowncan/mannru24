import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readDb, writeDb, Database } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

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
  return NextResponse.json(db.oauthApps, { headers: corsHeaders });
}

export async function POST(req: Request) {
  const check = await requireDev(req);
  if (!check.ok) return check.response;
  const { db, corsHeaders } = check;

  const { name, redirectUrl, iconUrl, scopes } = await req.json();
  if (!name || typeof name !== "string" || !redirectUrl || typeof redirectUrl !== "string") {
    return NextResponse.json({ error: "name and redirectUrl are required" }, { status: 400, headers: corsHeaders });
  }

  const app = {
    id: randomUUID(),
    clientId: randomUUID(),
    name,
    redirectUrl,
    iconUrl: iconUrl || "",
    scopes: Array.isArray(scopes) ? scopes : [],
    createdAt: new Date().toISOString(),
  };

  db.oauthApps.push(app);
  writeDb(db);

  return NextResponse.json(app, { status: 201, headers: corsHeaders });
}
