import { NextResponse } from "next/server";
import { readDb, writeDb, logClick } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, cardId } = await req.json();
  if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const db = readDb();
  const user = db.users.find((u) => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const card = db.cards.find((c) => c.id === cardId && c.userId === user.id);
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
  if (card.balance < amount) return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });

  card.balance -= amount;
  db.charityBalance = (db.charityBalance || 0) + amount;
  user.totalSpent += amount;
  logClick(db, user.id, `Пожертвование в ларёк: -${amount} МР`);
  writeDb(db);

  return NextResponse.json({ success: true, newBalance: card.balance, poolBalance: db.charityBalance });
}
