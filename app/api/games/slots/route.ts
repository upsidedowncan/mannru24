import { NextResponse } from "next/server";
import { readDb, writeDb, logClick } from "@/lib/db";
import { getSession } from "@/lib/auth";

const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "🔔", "💎", "7️⃣"];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bet, cardId } = await req.json();

  if (!bet || bet <= 0) {
    return NextResponse.json({ error: "Invalid bet" }, { status: 400 });
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === session.user.id);
  const card = db.cards.find((c) => c.id === cardId && c.userId === session.user.id);

  if (!user || !card) {
    return NextResponse.json({ error: "User or Card not found" }, { status: 404 });
  }

  if (card.balance < bet) {
    return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
  }

  // Deduct bet
  card.balance -= bet;
  user.totalSpent += bet;

  // Generate result
  // 3 reels
  const result = [
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
  ];

  let multiplier = 0;
  let winMessage = "Повезет в другой раз!";

  if (result[0] === result[1] && result[1] === result[2]) {
    // Jackpot or 3 of a kind
    const symbol = result[0];
    if (symbol === "7️⃣") multiplier = 50;
    else if (symbol === "💎") multiplier = 20;
    else if (symbol === "🔔") multiplier = 10;
    else multiplier = 5;

    winMessage = `ДЖЕКПОТ! Вы выиграли x${multiplier}!`;
  } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
    // 2 of a kind
    multiplier = 1.5;
    winMessage = "Неплохо! Небольшой выигрыш.";
  }

  const winAmount = Math.floor(bet * multiplier);
  if (winAmount > 0) {
    card.balance += winAmount;
    user.totalEarned += winAmount;
  }

  logClick(db, user.id, `Сыграл в слоты: ставка ${bet}, результат [${result.join(",")}], выигрыш ${winAmount}`);
  writeDb(db);

  return NextResponse.json({
    result,
    winAmount,
    winMessage,
    newBalance: card.balance
  });
}
