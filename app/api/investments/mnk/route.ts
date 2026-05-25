import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getSession, decrypt } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

async function getAuthUser(req: Request): Promise<{ id: string; name: string } | null> {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (bearerToken) {
    try {
      const payload = await decrypt(bearerToken);
      if (payload?.user?.id) return { id: payload.user.id, name: payload.user.name ?? "" };
      return null;
    } catch {
      return null;
    }
  }
  const session = await getSession();
  if (!session) return null;
  return { id: session.user.id, name: session.user.name };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  const currentUser = await getAuthUser(req);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const db = readDb();
  const user = db.users.find(u => u.id === currentUser.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404, headers: corsHeaders });

  return NextResponse.json({ mnkBalance: user.mnkBalance ?? 0 }, { headers: corsHeaders });
}

export async function POST(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  const currentUser = await getAuthUser(req);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const db = readDb();
  const userIdx = db.users.findIndex(u => u.id === currentUser.id);
  if (userIdx === -1) return NextResponse.json({ error: "Not found" }, { status: 404, headers: corsHeaders });

  const user = db.users[userIdx];
  const body = await req.json();

  if (body.action === "crash") {
    db.users.forEach(u => { u.mnkBalance = 0; });
    writeDb(db);
    return NextResponse.json({ mnkBalance: 0 }, { headers: corsHeaders });
  }

  if (body.action === "buy") {
    const { mnkAmount, cardId, price } = body;
    if (!mnkAmount || mnkAmount <= 0) return NextResponse.json({ error: "Некорректное количество" }, { status: 400, headers: corsHeaders });
    if (!price || price <= 0) return NextResponse.json({ error: "Некорректная цена" }, { status: 400, headers: corsHeaders });

    const cost = mnkAmount * price;
    const card = db.cards.find(c => c.id === cardId && c.userId === currentUser.id);
    if (!card) return NextResponse.json({ error: "Карта не найдена" }, { status: 400, headers: corsHeaders });
    if (card.balance < cost) return NextResponse.json({ error: "Недостаточно средств на карте" }, { status: 400, headers: corsHeaders });

    card.balance -= cost;
    user.mnkBalance = (user.mnkBalance ?? 0) + mnkAmount;
    writeDb(db);
    return NextResponse.json({ mnkBalance: user.mnkBalance, cardBalance: card.balance }, { headers: corsHeaders });
  }

  if (body.action === "sell") {
    const { mnkAmount, price, cardId } = body;
    if (!mnkAmount || mnkAmount <= 0) return NextResponse.json({ error: "Некорректное количество" }, { status: 400, headers: corsHeaders });
    if ((user.mnkBalance ?? 0) < mnkAmount) return NextResponse.json({ error: "Недостаточно MNK" }, { status: 400, headers: corsHeaders });

    const proceeds = mnkAmount * price;
    user.mnkBalance = (user.mnkBalance ?? 0) - mnkAmount;

    const card = cardId
      ? db.cards.find(c => c.id === cardId && c.userId === currentUser.id)
      : db.cards.find(c => c.userId === currentUser.id);
    if (card) card.balance += proceeds;

    writeDb(db);
    return NextResponse.json({ mnkBalance: user.mnkBalance, proceeds, cardBalance: card?.balance }, { headers: corsHeaders });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400, headers: corsHeaders });
}
