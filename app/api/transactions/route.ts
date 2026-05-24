import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, Transaction, addXp, calculateLevel, logClick } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

function updateTasksForTransaction(db: any, userId: string, tx: any) {
  const completedTaskIds: string[] = [];
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) return completedTaskIds;

  db.tasks.filter((t: any) => t.userId === userId).forEach((task: any) => {
    if (task.completed) return;
    let shouldIncrement = false;
    if (task.title.includes("3 покупки") && tx.amount < 0) shouldIncrement = true;
    if (task.title.includes("10 покупок") && tx.amount < 0) shouldIncrement = true;
    if (task.title.includes("Пополните") && tx.amount > 0) {
      task.progress += Math.abs(tx.amount);
      if (task.progress >= task.total && !task.completed) {
        task.completed = true; task.progress = task.total;
        user.bonusBalance += task.rewardPoints;
        completedTaskIds.push(task.id);
      }
      return;
    }
    if (task.title.includes("Переведите") && tx.category === "Переводы" && tx.amount < 0) {
      task.progress += Math.abs(tx.amount);
      if (task.progress >= task.total && !task.completed) {
        task.completed = true; task.progress = task.total;
        user.bonusBalance += task.rewardPoints;
        completedTaskIds.push(task.id);
      }
      return;
    }
    if (task.title.includes("QR") && tx.category === "QR-оплата") shouldIncrement = true;
    if (task.title.includes("Потратьте") && tx.amount < 0) {
      task.progress += Math.abs(tx.amount);
      if (task.progress >= task.total && !task.completed) {
        task.completed = true; task.progress = task.total;
        user.bonusBalance += task.rewardPoints;
        completedTaskIds.push(task.id);
      }
      return;
    }
    if (task.title.includes("коммунальные") && tx.category === "ЖКХ") shouldIncrement = true;
    if (shouldIncrement) {
      task.progress += 1;
      if (task.progress >= task.total && !task.completed) {
        task.completed = true; task.progress = task.total;
        user.bonusBalance += task.rewardPoints;
        completedTaskIds.push(task.id);
      }
    }
  });
  return completedTaskIds;
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const db = readDb();
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit");
  let transactions = db.transactions.filter(t => t.userId === session.user.id);
  if (limit) transactions = transactions.slice(0, parseInt(limit));
  return NextResponse.json(transactions, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const db = readDb();
  const body = await req.json();

  // Emoji code validation
  if (body.category === "Переводы" && body.emojiCode) {
    if (!/^[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]{4}$/u.test(body.emojiCode)) {
       return NextResponse.json({ error: "Invalid emoji code. Exactly 4 emojis required." }, { status: 400, headers: corsHeaders });
    }
  }

  const tx: Transaction = {
    id: crypto.randomUUID(),
    userId: session.user.id,
    name: body.name,
    category: body.category || "Покупки",
    amount: body.amount,
    date: body.date || new Date().toLocaleString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    cardId: body.cardId,
    emojiCode: body.emojiCode || null,
  };

  db.transactions.unshift(tx);
  logClick(db, session.user.id, `Транзакция: ${body.name} (${body.amount} MR)`);
  if (body.cardId) {
    const card = db.cards.find((c: any) => c.id === body.cardId && c.userId === session.user.id);
    if (card) card.balance += body.amount;
  }

  let txLevelUps: number[] = [];
  if (body.amount < 0) {
    const spentXp = Math.floor(Math.abs(body.amount) / 100);
    if (spentXp > 0) txLevelUps = addXp(db, session.user.id, spentXp);
  }

  const completedTasks = updateTasksForTransaction(db, session.user.id, tx);
  writeDb(db);

  const user = db.users.find(u => u.id === session.user.id);
  const { level, currentXp, nextXp } = calculateLevel(user?.xp || 0);

  return NextResponse.json({ transaction: tx, completedTasks, levelUps: txLevelUps, level, currentXp, nextXp, xp: user?.xp }, { status: 201, headers: corsHeaders });
}
