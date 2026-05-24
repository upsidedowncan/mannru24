import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("client_id");

  if (!clientId) {
    return NextResponse.json({ error: "Missing client_id" }, { status: 400, headers: corsHeaders });
  }

  const db = readDb();
  const app = db.oauthApps.find(a => a.id === clientId);

  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404, headers: corsHeaders });
  }

  return NextResponse.json(
    {
      id: app.id,
      name: app.name,
      url: app.url,
      icon: app.icon,
      scopes: app.scopes,
    },
    { headers: corsHeaders }
  );
}
