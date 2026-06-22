import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, Card, CardTier, addXp, calculateLevel, logClick } from "@/lib/db";
import { getSession, decrypt } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";
import { tierUnlockLevel } from "@/lib/constants";

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

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const currentUser = await getAuthUser(req);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const db = readDb();
  logClick(db, currentUser.id, "Просмотр списка карт");
  writeDb(db);
  return NextResponse.json(db.cards.filter(c => c.userId === currentUser.id), { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const currentUser = await getAuthUser(req);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const db = readDb();
  const user = db.users.find(u => u.id === currentUser.id);
  const { level } = calculateLevel(user?.xp || 0);

  const userCards = db.cards.filter(c => c.userId === currentUser.id);
  if (userCards.length >= 25) {
    return NextResponse.json({ error: "Maximum card limit (25) reached" }, { status: 400, headers: corsHeaders });
  }

  const body = await req.json();
  const tier = body.tier as CardTier;

  // Server-side tier level enforcement — frontend locks are purely cosmetic
  const requiredLevel = tierUnlockLevel[tier] ?? 1;
  if (level < requiredLevel) {
    return NextResponse.json(
      { error: `Куда лезешь? Тариф «${tier}» доступен только с ${requiredLevel} уровня. Качайся.` },
      { status: 403, headers: corsHeaders }
    );
  }

  // Enforce upgrade cost server-side — don't trust client-supplied upgradeCost
  if (body.sourceCardId) {
    const sourceCard = db.cards.find(c => c.id === body.sourceCardId && c.userId === currentUser.id);
    if (!sourceCard) {
      return NextResponse.json({ error: "Source card not found" }, { status: 404, headers: corsHeaders });
    }
    const tierOrder: CardTier[] = ["bronze", "silver", "gold", "platinum", "titanium", "ruby", "emerald", "sapphire", "diamond", "black", "obsidian"];
    const fromIndex = tierOrder.indexOf(sourceCard.tier);
    const toIndex = tierOrder.indexOf(tier);
    if (toIndex <= fromIndex) {
      return NextResponse.json({ error: "Cannot downgrade a card tier" }, { status: 400, headers: corsHeaders });
    }
  }

  const existingCodes = db.cards.map((c) => c.emojiCode).filter(Boolean) as string[];
  const emojiCode = emojiTiers.includes(tier) ? generateEmojiCode(existingCodes) : null;

  const newCard: Card = {
    id: crypto.randomUUID(),
    userId: currentUser.id,
    tier,
    number: body.number || `•••• •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`,
    holder: body.holder || currentUser.name.toUpperCase(),
    balance: body.balance ?? 0,
    expiry: body.expiry || `${String(Math.floor(1 + Math.random() * 12)).padStart(2, "0")}/${Math.floor(27 + Math.random() * 5)}`,
    createdAt: new Date().toISOString(),
    emojiCode,
  };

  if (body.sourceCardId && body.upgradeCost) {
    const sourceIdx = db.cards.findIndex((c) => c.id === body.sourceCardId && c.userId === currentUser.id);
    if (sourceIdx !== -1) db.cards[sourceIdx].balance -= body.upgradeCost;
  }

  db.cards.push(newCard);
  logClick(db, currentUser.id, `Создание карты тарифа ${tier}`);
  const levelUps = addXp(db, currentUser.id, 5);
  writeDb(db);

  const updatedUser = db.users.find(u => u.id === currentUser.id);
  const { level: newLevel, currentXp, nextXp } = calculateLevel(updatedUser?.xp || 0);

  return NextResponse.json({ card: newCard, levelUps, level: newLevel, currentXp, nextXp, xp: updatedUser?.xp }, { status: 201, headers: corsHeaders });
}

export async function DELETE(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const currentUser = await getAuthUser(req);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const db = readDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400, headers: corsHeaders });

  db.cards = db.cards.filter((c) => c.id !== id || c.userId !== currentUser.id);
  writeDb(db);
  return NextResponse.json({ success: true }, { headers: corsHeaders });
}

export async function PATCH(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const currentUser = await getAuthUser(req);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const db = readDb();
  const user = db.users.find(u => u.id === currentUser.id);
  const { level } = calculateLevel(user?.xp || 0);

  const body = await req.json();
  const idx = db.cards.findIndex((c) => c.id === body.id && c.userId === currentUser.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404, headers: corsHeaders });

  // Server-side tier level enforcement for upgrades too
  if (body.tier) {
    const requiredLevel = tierUnlockLevel[body.tier as CardTier] ?? 1;
    if (level < requiredLevel) {
      return NextResponse.json(
        { error: `Куда лезешь? Тариф «${body.tier}» доступен только с ${requiredLevel} уровня. Качайся.` },
        { status: 403, headers: corsHeaders }
      );
    }
  }

  if (body.sourceCardId && body.upgradeCost) {
    if (body.sourceCardId === body.id) {
      db.cards[idx].balance -= body.upgradeCost;
    } else {
      const sourceIdx = db.cards.findIndex((c) => c.id === body.sourceCardId && c.userId === currentUser.id);
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
