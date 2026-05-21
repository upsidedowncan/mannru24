import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, Transaction, Task, addXp, calculateLevel } from "@/lib/db";

function ensureBaseData() {
  const db = readDb();
  if (db.tasks.length === 0) {
    db.user = {
      name: "Александр", phone: "+7 (999) 123-45-67", bonusBalance: 12450,
      totalEarned: 16650, totalSpent: 8450, streak: 7, level: 1, xp: 0,
    };
    db.tasks = [
      { id: "task-1", title: "Оплатите 3 покупки картой", description: "Совершите 3 любые оплаты картой Маннру сегодня", reward: "50 баллов", rewardPoints: 50, progress: 0, total: 3, type: "daily", completed: false },
      { id: "task-2", title: "Пополните счёт на 10 000 МР", description: "Пополните баланс вашей карты на сумму от 10 000 МР", reward: "200 баллов", rewardPoints: 200, progress: 0, total: 10000, type: "daily", completed: false },
      { id: "task-3", title: "Переведите 1 000 МР другу", description: "Сделайте перевод любому контакту на сумму от 1 000 МР", reward: "100 баллов", rewardPoints: 100, progress: 0, total: 1000, type: "daily", completed: false },
      { id: "task-4", title: "Оплатите покупку через QR", description: "Используйте QR-код для оплаты в магазине", reward: "75 баллов", rewardPoints: 75, progress: 0, total: 1, type: "daily", completed: false },
      { id: "task-5", title: "Пригласите друга", description: "Отправьте приглашение другу и получите бонус", reward: "500 баллов", rewardPoints: 500, progress: 0, total: 1, type: "weekly", completed: false },
      { id: "task-6", title: "Оплатите 10 покупок за неделю", description: "Совершите 10 оплат картой в течение недели", reward: "300 баллов", rewardPoints: 300, progress: 0, total: 10, type: "weekly", completed: false },
      { id: "task-7", title: "Активируйте 2 бонуса", description: "Активируйте любые 2 бонуса из раздела бонусов", reward: "250 баллов", rewardPoints: 250, progress: 0, total: 2, type: "weekly", completed: false },
      { id: "task-8", title: "Войдите 7 дней подряд", description: "Откройте приложение каждый день в течение недели", reward: "150 баллов", rewardPoints: 150, progress: 0, total: 7, type: "weekly", completed: false },
      { id: "task-9", title: "Подключите автоплатёж", description: "Настройте автоматическую оплату для любого сервиса", reward: "1 000 баллов", rewardPoints: 1000, progress: 0, total: 1, type: "special", completed: false },
      { id: "task-10", title: "Потратьте 50 000 МР за месяц", description: "Достигните суммы расходов 50 000 МР за текущий месяц", reward: "2 000 баллов", rewardPoints: 2000, progress: 0, total: 50000, type: "special", completed: false },
      { id: "task-11", title: "Создайте вторую карту", description: "Оформите дополнительную карту любого тарифа", reward: "300 баллов", rewardPoints: 300, progress: 0, total: 1, type: "special", completed: false },
      { id: "task-12", title: "Оплатите коммунальные услуги", description: "Оплатите ЖКХ через приложение Маннру", reward: "200 баллов", rewardPoints: 200, progress: 0, total: 1, type: "special", completed: false },
    ];
    db.bonuses = [
      { id: "bonus-1", title: "Кэшбэк 10% на рестораны", description: "Повышенный кэшбэк при оплате в ресторанах-партнёрах", points: 500, category: "Кэшбэк", expires: "3 дня", activated: false },
      { id: "bonus-2", title: "Бесплатная подписка 3 месяца", description: "Бесплатная подписка на музыку при оплате картой Маннру", points: 300, category: "Акции", expires: "7 дней", activated: false },
      { id: "bonus-3", title: "Двойные бонусы за АЗС", description: "2x бонусные баллы при оплате на заправках", points: 800, category: "Кэшбэк", expires: "5 дней", activated: false },
      { id: "bonus-4", title: "Скидка 30% на первую доставку", description: "Скидка на первый заказ в сервисе доставки", points: 400, category: "Акции", expires: "14 дней", activated: false },
      { id: "bonus-5", title: "Кэшбэк 5% на развлечения", description: "Повышенный кэшбэк за кино, концерты и мероприятия", points: 600, category: "Кэшбэк", expires: "10 дней", activated: false },
      { id: "bonus-6", title: "Розыгрыш 100 000 МР", description: "Участвуйте в розыгрыше при оплате любой покупки от 500 МР", points: 1000, category: "Акции", expires: "30 дней", activated: false },
    ];
    writeDb(db);
  }
  return db;
}

function updateTasksForTransaction(db: any, tx: any) {
  const completedTaskIds: string[] = [];
  db.tasks.forEach((task: any) => {
    if (task.completed) return;
    let shouldIncrement = false;
    if (task.title.includes("3 покупки") && tx.amount < 0) shouldIncrement = true;
    if (task.title.includes("10 покупок") && tx.amount < 0) shouldIncrement = true;
    if (task.title.includes("Пополните") && tx.amount > 0) {
      task.progress += Math.abs(tx.amount);
      if (task.progress >= task.total && !task.completed) {
        task.completed = true; task.progress = task.total;
        db.user.bonusBalance += task.rewardPoints;
        completedTaskIds.push(task.id);
      }
      return;
    }
    if (task.title.includes("Переведите") && tx.category === "Переводы" && tx.amount < 0) {
      task.progress += Math.abs(tx.amount);
      if (task.progress >= task.total && !task.completed) {
        task.completed = true; task.progress = task.total;
        db.user.bonusBalance += task.rewardPoints;
        completedTaskIds.push(task.id);
      }
      return;
    }
    if (task.title.includes("QR") && tx.category === "QR-оплата") shouldIncrement = true;
    if (task.title.includes("Потратьте") && tx.amount < 0) {
      task.progress += Math.abs(tx.amount);
      if (task.progress >= task.total && !task.completed) {
        task.completed = true; task.progress = task.total;
        db.user.bonusBalance += task.rewardPoints;
        completedTaskIds.push(task.id);
      }
      return;
    }
    if (task.title.includes("коммунальные") && tx.category === "ЖКХ") shouldIncrement = true;
    if (shouldIncrement) {
      task.progress += 1;
      if (task.progress >= task.total && !task.completed) {
        task.completed = true; task.progress = task.total;
        db.user.bonusBalance += task.rewardPoints;
        completedTaskIds.push(task.id);
      }
    }
  });
  return completedTaskIds;
}

export async function GET(req: NextRequest) {
  const db = ensureBaseData();
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit");
  let transactions = db.transactions;
  if (limit) transactions = transactions.slice(0, parseInt(limit));
  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const db = ensureBaseData();
  const body = await req.json();
  const tx: Transaction = {
    id: crypto.randomUUID(),
    name: body.name,
    category: body.category || "Покупки",
    amount: body.amount,
    date: body.date || new Date().toLocaleString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    cardId: body.cardId,
    emojiCode: body.emojiCode || null,
  };
  db.transactions.unshift(tx);
  if (body.cardId) {
    const card = db.cards.find((c: any) => c.id === body.cardId);
    if (card) card.balance += body.amount;
  }
  let txLevelUps: number[] = [];
  if (body.amount < 0) {
    const spentXp = Math.floor(Math.abs(body.amount) / 100);
    if (spentXp > 0) txLevelUps = addXp(db, spentXp);
  }
  const completedTasks = updateTasksForTransaction(db, tx);
  writeDb(db);
  const { level, currentXp, nextXp } = calculateLevel(db.user.xp);
  return NextResponse.json({ transaction: tx, completedTasks, levelUps: txLevelUps, level, currentXp, nextXp, xp: db.user.xp }, { status: 201 });
}
