import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const mnkAmount: number = parseFloat(body.mnkAmount);
  const price: number = parseFloat(body.price);

  if (!mnkAmount || mnkAmount <= 0 || !price || price <= 0) {
    return NextResponse.json({ error: "Неверные параметры" }, { status: 400 });
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  const holdings = user.mnkHoldings ?? 0;
  if (holdings < mnkAmount) {
    return NextResponse.json({ error: "Недостаточно MNK на счёте" }, { status: 400 });
  }

  user.mnkHoldings = holdings - mnkAmount;

  // Credit MR to the card with the highest balance
  const userCards = db.cards
    .filter((c) => c.userId === session.user.id)
    .sort((a, b) => b.balance - a.balance);

  if (userCards.length === 0) {
    return NextResponse.json({ error: "Нет карт для зачисления средств" }, { status: 400 });
  }

  const mrAmount = mnkAmount * price;
  const card = userCards[0];
  const cardIdx = db.cards.findIndex((c) => c.id === card.id);
  db.cards[cardIdx].balance += mrAmount;

  db.transactions.unshift({
    id: crypto.randomUUID(),
    userId: session.user.id,
    name: `Продажа MNK · ${mnkAmount.toFixed(6)} MNK`,
    category: "Инвестиции",
    amount: mrAmount,
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
    db.mnkMarket.basePrice = Math.max(
      db.mnkMarket.basePrice * (1 - impact * 0.5),
      0.001
    );
  }

  writeDb(db);
  return NextResponse.json({ mnkHoldings: user.mnkHoldings, mrReceived: mrAmount });
}
