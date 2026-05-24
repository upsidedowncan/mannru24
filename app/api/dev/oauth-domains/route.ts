import { NextResponse } from "next/server";
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

  return NextResponse.json({ domains: db.allowedOAuthDomains }, { headers: corsHeaders });
}

export async function POST(req: Request) {
  const check = await requireDev(req);
  if (!check.ok) return check.response;
  const { db, corsHeaders } = check;

  const { domain } = await req.json();
  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "Missing domain" }, { status: 400, headers: corsHeaders });
  }

  if (!db.allowedOAuthDomains.includes(domain)) {
    db.allowedOAuthDomains.push(domain);
    writeDb(db);
  }

  return NextResponse.json({ success: true, domains: db.allowedOAuthDomains }, { headers: corsHeaders });
}

export async function DELETE(req: Request) {
  const check = await requireDev(req);
  if (!check.ok) return check.response;
  const { db, corsHeaders } = check;

  const { domain } = await req.json();
  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "Missing domain" }, { status: 400, headers: corsHeaders });
  }

  db.allowedOAuthDomains = db.allowedOAuthDomains.filter(d => d !== domain);
  writeDb(db);

  return NextResponse.json({ success: true, domains: db.allowedOAuthDomains }, { headers: corsHeaders });
}
