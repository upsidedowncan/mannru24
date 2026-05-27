import { NextResponse } from "next/server";
import { readDb, writeDb, logClick } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const db = readDb();
  return NextResponse.json({ balance: db.charityBalance || 0 });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, amount, cardId } = await req.json();
  const db = readDb();
  const user = db.users.find(u => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (action === "deposit") {
    if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    const card = db.cards.find(c => c.id === cardId && c.userId === user.id);
    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
    if (card.balance < amount) return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });

    card.balance -= amount;
    db.charityBalance = (db.charityBalance || 0) + amount;
    user.totalSpent += amount;
    logClick(db, user.id, `Пожертвование в ларёк: -${amount} МР`);
    writeDb(db);
    return NextResponse.json({ success: true, newBalance: card.balance, poolBalance: db.charityBalance });
  }

  if (action === "withdraw") {
    // Allowance logic: only for "poor" (card balance < 100) or just a small daily amount
    const limit = 50;
    if ((db.charityBalance || 0) < limit) return NextResponse.json({ error: "Ларёк пуст. Приходите позже." }, { status: 400 });

    const card = db.cards.find(c => c.userId === user.id); // Just pick first card
    if (!card) return NextResponse.json({ error: "No card found" }, { status: 404 });

    // Check if claimed today? Reuse claimedGifts or just allow once per session/hour
    // For simplicity, let's just allow it if balance is very low
    if (card.balance > 200) return NextResponse.json({ error: "Вы слишком богаты для этого ларька." }, { status: 400 });

    card.balance += limit;
    db.charityBalance = (db.charityBalance || 0) - limit;
    user.totalEarned += limit;
    logClick(db, user.id, `Забрал из ларька: +${limit} МР`);
    writeDb(db);
    return NextResponse.json({ success: true, newBalance: card.balance, poolBalance: db.charityBalance });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
