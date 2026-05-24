import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getSession, encrypt } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function POST(req: Request) {
  const corsHeaders = getCorsHeaders(req);

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: corsHeaders });
  }

  const { clientId, redirectUri } = await req.json();
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "clientId and redirectUri are required" }, { status: 400, headers: corsHeaders });
  }

  const db = readDb();
  const app = db.oauthApps.find(a => a.clientId === clientId);
  if (!app) {
    return NextResponse.json({ error: "Invalid client_id" }, { status: 404, headers: corsHeaders });
  }

  if (app.redirectUrl !== redirectUri) {
    return NextResponse.json({ error: "redirect_uri mismatch" }, { status: 400, headers: corsHeaders });
  }

  const user = db.users.find(u => u.id === session.user.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401, headers: corsHeaders });
  }

  const token = await encrypt(
    { user: { id: user.id, name: user.name }, clientId, scopes: app.scopes, appName: app.name },
    "1h"
  );

  return NextResponse.json({ token, expiresIn: 3600 }, { headers: corsHeaders });
}
