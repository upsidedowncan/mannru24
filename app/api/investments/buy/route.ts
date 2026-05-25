import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const mrAmount: number = parseFloat(body.mrAmount);
  const price: number = parseFloat(body.price);

  if (!mrAmount || mrAmount <= 0 || !price || price <= 0) {
    return NextResponse.json({ error: "Неверные параметры" }, { status: 400 });
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  // Find a card with enough balance (prefer highest balance)
  const userCards = db.cards
    .filter((c) => c.userId === session.user.id && c.balance >= mrAmount)
    .sort((a, b) => b.balance - a.balance);

  if (userCards.length === 0) {
    return NextResponse.json({ error: "Недостаточно средств на карте" }, { status: 400 });
  }

  const card = userCards[0];
  const cardIdx = db.cards.findIndex((c) => c.id === card.id);
  db.cards[cardIdx].balance -= mrAmount;

  const mnkAmount = mrAmount / price;
  user.mnkHoldings = (user.mnkHoldings ?? 0) + mnkAmount;

  db.transactions.unshift({
    id: crypto.randomUUID(),
    userId: session.user.id,
    name: `Покупка MNK · ${mnkAmount.toFixed(6)} MNK`,
    category: "Инвестиции",
    amount: -mrAmount,
    date: new Date().toLocaleString("ru", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    cardId: card.id,
    emojiCode: null,
  });

  if (db.mnkMarket && !db.mnkMarket.crashed) {
    const impact = mrAmount / (price * 10_000);
    db.mnkMarket.basePrice = Math.min(
      db.mnkMarket.basePrice * (1 + impact * 0.5),
      71_500
    );
  }

  writeDb(db);
  return NextResponse.json({ mnkHoldings: user.mnkHoldings, mnkAmount });
}
