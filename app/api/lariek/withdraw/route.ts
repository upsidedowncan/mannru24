import { NextResponse } from "next/server";
import { readDb, writeDb, logClick } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId } = await req.json();

  const db = readDb();
  const user = db.users.find((u) => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const limit = 50;
  if ((db.charityBalance || 0) < limit)
    return NextResponse.json({ error: "Ларёк пуст. Приходите позже." }, { status: 400 });

  const card = cardId
    ? db.cards.find((c) => c.id === cardId && c.userId === user.id)
    : db.cards.find((c) => c.userId === user.id);
  if (!card) return NextResponse.json({ error: "No card found" }, { status: 404 });

  if (card.balance > 1000)
    return NextResponse.json({ error: "Вы слишком богаты для этого ларька." }, { status: 400 });

  card.balance += limit;
  db.charityBalance = (db.charityBalance || 0) - limit;
  user.totalEarned += limit;
  logClick(db, user.id, `Забрал из ларька: +${limit} МР`);
  writeDb(db);

  return NextResponse.json({ success: true, amount: limit, newBalance: card.balance, poolBalance: db.charityBalance });
}
