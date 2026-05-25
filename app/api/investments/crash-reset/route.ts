import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

const STARTING_PRICE = 0.1;

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDb();
  const user = db.users.find((u) => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const burned = user.mnkHoldings ?? 0;
  user.mnkHoldings = 0;

  // Reset global market state
  db.mnkMarket = {
    basePrice: STARTING_PRICE,
    startTime: Date.now(),
    candles: [],
    crashed: false,
  };

  if (burned > 0) {
    db.transactions.unshift({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name: `КРАХ МАРКЕТА — ${burned.toFixed(6)} MNK сожжено`,
      category: "Инвестиции",
      amount: 0,
      date: new Date().toLocaleString("ru", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      emojiCode: null,
    });
  }

  writeDb(db);
  return NextResponse.json({ success: true, burned });
}
