import { NextResponse } from "next/server";
import { readDb, writeDb, logClick, addXp } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { bet, cardId, side } = body; // side: 'heads' or 'tails'

  if (!bet || bet <= 0) return NextResponse.json({ error: "Invalid bet" }, { status: 400 });
  if (!['heads', 'tails'].includes(side)) return NextResponse.json({ error: "Invalid side" }, { status: 400 });

  const db = readDb();
  const user = db.users.find(u => u.id === session.user.id);
  const card = db.cards.find(c => c.id === cardId && c.userId === session.user.id);

  if (!user || !card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (card.balance < bet) return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });

  // Play game
  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  const won = side === result;

  // Transaction
  card.balance -= bet;
  let winnings = 0;
  if (won) {
    winnings = bet * 1.9; // 1.9x payout (house edge)
    card.balance += winnings;
    user.totalEarned += winnings;
    logClick(db, user.id, `Выиграл в Орел и Решка: +${winnings} МР (выпало ${result === 'heads' ? 'Орел' : 'Решка'})`);
  } else {
    user.totalSpent += bet;
    logClick(db, user.id, `Проиграл в Орел и Решка: -${bet} МР (выпало ${result === 'heads' ? 'Орел' : 'Решка'})`);
  }

  addXp(db, user.id, 2);
  writeDb(db);

  return NextResponse.json({
    result,
    won,
    winnings,
    newBalance: card.balance
  });
}
