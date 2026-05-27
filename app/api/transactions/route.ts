import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, Transaction, addXp, calculateLevel, logClick } from "@/lib/db";
import { getSession, decrypt } from "@/lib/auth";
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

async function getAuthUser(req: Request): Promise<{ id: string; name: string; appName?: string } | null> {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (bearerToken) {
    try {
      const payload = await decrypt(bearerToken);
      if (payload?.user?.id) return {
        id: payload.user.id as string,
        name: (payload.user as any).name ?? "",
        appName: (payload.appName as string) || (payload.clientId as string) || undefined,
      };
      return null;
    } catch {
      return null;
    }
  }
  const session = await getSession();
  if (!session) return null;
  return { id: session.user.id, name: session.user.name };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const currentUser = await getAuthUser(req);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const db = readDb();
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit");
  let transactions = db.transactions.filter(t => t.userId === currentUser.id);
  if (limit) transactions = transactions.slice(0, parseInt(limit));
  return NextResponse.json(transactions, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const currentUser = await getAuthUser(req);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const db = readDb();
  const body = await req.json();

  if (body.category === "Переводы" && body.emojiCode) {
    if (!/^[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]{4}$/u.test(body.emojiCode)) {
       return NextResponse.json({ error: "Invalid emoji code. Exactly 4 emojis required." }, { status: 400, headers: corsHeaders });
    }
  }

  const tx: Transaction = {
    id: crypto.randomUUID(),
    userId: currentUser.id,
    name: body.name,
    category: body.category || "Покупки",
    amount: body.amount,
    date: body.date || new Date().toLocaleString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    cardId: body.cardId,
    emojiCode: body.emojiCode || null,
    source: currentUser.appName,
  };

  db.transactions.unshift(tx);
  logClick(db, currentUser.id, `Транзакция: ${body.name} (${body.amount} MR)`);

  let finalDeduction = body.amount;
  let isRewardsCard = false;

  if (body.cardId) {
    const card = db.cards.find((c: any) => c.id === body.cardId && c.userId === currentUser.id);
    if (card) {
      if (card.tier === "rewards" && body.amount < 0) {
        // Apply 6% commission for spending/transferring from rewards card
        finalDeduction = Math.round(body.amount * 1.06);
        isRewardsCard = true;
        tx.description = (tx.description || "") + " (Включая комиссию 6%)";
      }
      card.balance += finalDeduction;
    }
  }

  let txLevelUps: number[] = [];
  // XP only awarded for spending from regular cards
  if (body.amount < 0 && !isRewardsCard) {
    const spentXp = Math.floor(Math.abs(body.amount) / 100);
    if (spentXp > 0) txLevelUps = addXp(db, currentUser.id, spentXp);
  }

  const completedTasks = updateTasksForTransaction(db, currentUser.id, tx);
  writeDb(db);

  const user = db.users.find(u => u.id === currentUser.id);
  const { level, currentXp, nextXp } = calculateLevel(user?.xp || 0);

  return NextResponse.json({ transaction: tx, completedTasks, levelUps: txLevelUps, level, currentXp, nextXp, xp: user?.xp }, { status: 201, headers: corsHeaders });
}
