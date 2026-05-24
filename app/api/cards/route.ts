import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, Card, CardTier, addXp, calculateLevel, logClick } from "@/lib/db";
import { getSession, resolveBearerAuth } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

const emojiTiers: CardTier[] = ["gold", "platinum", "titanium", "ruby", "emerald", "sapphire", "diamond", "black", "obsidian"];
const emojiPool = ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🪲","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐈","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔"];

function generateEmojiCode(existingCodes: string[]): string {
  const pick4 = () => {
    const shuffled = [...emojiPool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4).join("");
  };
  let code = pick4();
  let attempts = 0;
  while (existingCodes.includes(code) && attempts < 100) {
    code = pick4();
    attempts++;
  }
  return code;
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  const bearer = await resolveBearerAuth(req, "read:balance");
  let userId: string;
  if (bearer === null) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    userId = session.user.id;
  } else if (!bearer.ok) {
    return NextResponse.json({ error: bearer.error }, { status: bearer.status, headers: corsHeaders });
  } else {
    userId = bearer.userId;
  }

  const db = readDb();
  logClick(db, userId, "Просмотр списка карт");
  writeDb(db);
  return NextResponse.json(db.cards.filter(c => c.userId === userId), { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  // No write:cards scope exists; card creation requires a cookie session.
  const bearer = await resolveBearerAuth(req, "write:cards");
  if (bearer !== null) {
    return NextResponse.json({ error: bearer.ok ? "Insufficient scope" : bearer.error }, { status: bearer.ok ? 403 : bearer.status, headers: corsHeaders });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const db = readDb();
  const body = await req.json();
  const tier = body.tier as CardTier;
  const existingCodes = db.cards.map((c) => c.emojiCode).filter(Boolean) as string[];
  const emojiCode = emojiTiers.includes(tier) ? generateEmojiCode(existingCodes) : null;

  const newCard: Card = {
    id: crypto.randomUUID(),
    userId: session.user.id,
    tier,
    number: body.number || `•••• •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`,
    holder: body.holder || session.user.name.toUpperCase(),
    balance: body.balance ?? 0,
    expiry: body.expiry || `${String(Math.floor(1 + Math.random() * 12)).padStart(2, "0")}/${Math.floor(27 + Math.random() * 5)}`,
    createdAt: new Date().toISOString(),
    emojiCode,
  };

  if (body.sourceCardId && body.upgradeCost) {
    const sourceIdx = db.cards.findIndex((c) => c.id === body.sourceCardId && c.userId === session.user.id);
    if (sourceIdx !== -1) db.cards[sourceIdx].balance -= body.upgradeCost;
  }

  db.cards.push(newCard);
  logClick(db, session.user.id, `Создание карты тарифа ${tier}`);
  const levelUps = addXp(db, session.user.id, 5);
  writeDb(db);

  const user = db.users.find(u => u.id === session.user.id);
  const { level, currentXp, nextXp } = calculateLevel(user?.xp || 0);

  return NextResponse.json({ card: newCard, levelUps, level, currentXp, nextXp, xp: user?.xp }, { status: 201, headers: corsHeaders });
}

export async function DELETE(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  // No write:cards scope exists; card deletion requires a cookie session.
  const bearer = await resolveBearerAuth(req, "write:cards");
  if (bearer !== null) {
    return NextResponse.json({ error: bearer.ok ? "Insufficient scope" : bearer.error }, { status: bearer.ok ? 403 : bearer.status, headers: corsHeaders });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const db = readDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400, headers: corsHeaders });

  db.cards = db.cards.filter((c) => c.id !== id || c.userId !== session.user.id);
  writeDb(db);
  return NextResponse.json({ success: true }, { headers: corsHeaders });
}

export async function PATCH(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  // No write:cards scope exists; card updates require a cookie session.
  const bearer = await resolveBearerAuth(req, "write:cards");
  if (bearer !== null) {
    return NextResponse.json({ error: bearer.ok ? "Insufficient scope" : bearer.error }, { status: bearer.ok ? 403 : bearer.status, headers: corsHeaders });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const db = readDb();
  const body = await req.json();
  const idx = db.cards.findIndex((c) => c.id === body.id && c.userId === session.user.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404, headers: corsHeaders });

  if (body.sourceCardId && body.upgradeCost) {
    if (body.sourceCardId === body.id) {
      db.cards[idx].balance -= body.upgradeCost;
    } else {
      const sourceIdx = db.cards.findIndex((c) => c.id === body.sourceCardId && c.userId === session.user.id);
      if (sourceIdx !== -1) db.cards[sourceIdx].balance -= body.upgradeCost;
    }
  }

  if (body.tier && emojiTiers.includes(body.tier) && !db.cards[idx].emojiCode) {
    const existingCodes = db.cards.map((c) => c.emojiCode).filter(Boolean) as string[];
    db.cards[idx].emojiCode = generateEmojiCode(existingCodes);
  }

  db.cards[idx] = { ...db.cards[idx], ...body };
  writeDb(db);
  return NextResponse.json(db.cards[idx], { headers: corsHeaders });
}
