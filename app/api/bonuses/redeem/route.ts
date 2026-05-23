import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDb();
  const user = db.users.find(u => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { amount, cardId } = body; // amount in bonus points

  if (!amount || amount <= 0 || user.bonusBalance < amount) {
    return NextResponse.json({ error: "Insufficient bonus balance" }, { status: 400 });
  }

  const card = db.cards.find(c => c.id === cardId && c.userId === session.user.id);
  if (!card) {
    return NextResponse.json({ error: "Target card not found" }, { status: 404 });
  }

  // Rate: 10 points = 1 MR
  const mrAmount = Math.floor(amount / 10);
  if (mrAmount <= 0) {
    return NextResponse.json({ error: "Amount too small for redemption" }, { status: 400 });
  }

  user.bonusBalance -= amount;
  card.balance += mrAmount;

  db.transactions.push({
    id: crypto.randomUUID(),
    userId: user.id,
    cardId: card.id,
    name: "Обмен бонусов на MR",
    category: "Бонусы",
    amount: mrAmount,
    date: new Date().toLocaleDateString("ru-RU"),
  });

  writeDb(db);

  return NextResponse.json({
    success: true,
    newBalance: card.balance,
    newBonusBalance: user.bonusBalance,
    mrReceived: mrAmount
  });
}
