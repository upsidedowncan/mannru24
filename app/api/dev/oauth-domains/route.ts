import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

const DEV_UUID = "62734945-0f34-4ae1-b6e2-1e2939fb09d3";

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  if (session.user.id !== DEV_UUID) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });

  const db = readDb();
  return NextResponse.json({ domains: db.allowedOAuthDomains ?? [] }, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  if (session.user.id !== DEV_UUID) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });

  const { domain } = await req.json();
  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "domain required" }, { status: 400, headers: corsHeaders });
  }

  const db = readDb();
  if (!db.allowedOAuthDomains) db.allowedOAuthDomains = [];
  if (!db.allowedOAuthDomains.includes(domain)) {
    db.allowedOAuthDomains.push(domain);
    writeDb(db);
  }
  return NextResponse.json({ domains: db.allowedOAuthDomains }, { headers: corsHeaders });
}

export async function DELETE(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  if (session.user.id !== DEV_UUID) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });

  const { domain } = await req.json();
  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "domain required" }, { status: 400, headers: corsHeaders });
  }

  const db = readDb();
  if (!db.allowedOAuthDomains) db.allowedOAuthDomains = [];
  db.allowedOAuthDomains = db.allowedOAuthDomains.filter(d => d !== domain);
  writeDb(db);
  return NextResponse.json({ domains: db.allowedOAuthDomains }, { headers: corsHeaders });
}
