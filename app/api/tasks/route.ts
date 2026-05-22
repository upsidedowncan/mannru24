import { NextResponse } from "next/server";
import { readDb, writeDb, Task } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDb();
  let tasks = db.tasks.filter(t => t.userId === session.user.id);

  if (tasks.length === 0) {
    const defaultTasks: Task[] = [
      { id: "task-1", userId: session.user.id, title: "Оплатите 3 покупки картой", description: "Совершите 3 любые оплаты картой Маннру сегодня", reward: "50 баллов", rewardPoints: 50, progress: 0, total: 3, type: "daily", completed: false },
      { id: "task-2", userId: session.user.id, title: "Пополните счёт на 10 000 МР", description: "Пополните баланс вашей карты на сумму от 10 000 МР", reward: "200 баллов", rewardPoints: 200, progress: 0, total: 10000, type: "daily", completed: false },
      { id: "task-3", userId: session.user.id, title: "Переведите 1 000 МР другу", description: "Сделайте перевод любому контакту на сумму от 1 000 МР", reward: "100 баллов", rewardPoints: 100, progress: 0, total: 1000, type: "daily", completed: false },
      { id: "task-4", userId: session.user.id, title: "Оплатите покупку через QR", description: "Используйте QR-код для оплаты в магазине", reward: "75 баллов", rewardPoints: 75, progress: 0, total: 1, type: "daily", completed: false },
      { id: "task-5", userId: session.user.id, title: "Пригласите друга", description: "Отправьте приглашение другу и получите бонус", reward: "500 баллов", rewardPoints: 500, progress: 0, total: 1, type: "weekly", completed: false },
      { id: "task-6", userId: session.user.id, title: "Оплатите 10 покупок за неделю", description: "Совершите 10 оплат картой в течение недели", reward: "300 баллов", rewardPoints: 300, progress: 0, total: 10, type: "weekly", completed: false },
      { id: "task-7", userId: session.user.id, title: "Активируйте 2 бонуса", description: "Активируйте любые 2 бонуса из раздела бонусов", reward: "250 баллов", rewardPoints: 250, progress: 0, total: 2, type: "weekly", completed: false },
      { id: "task-8", userId: session.user.id, title: "Войдите 7 дней подряд", description: "Откройте приложение каждый день в течение недели", reward: "150 баллов", rewardPoints: 150, progress: 0, total: 7, type: "weekly", completed: false },
      { id: "task-9", userId: session.user.id, title: "Подключите автоплатёж", description: "Настройте автоматическую оплату для любого сервиса", reward: "1 000 баллов", rewardPoints: 1000, progress: 0, total: 1, type: "special", completed: false },
      { id: "task-10", userId: session.user.id, title: "Потратьте 50 000 МР за месяц", description: "Достигните суммы расходов 50 000 МР за текущий месяц", reward: "2 000 баллов", rewardPoints: 2000, progress: 0, total: 50000, type: "special", completed: false },
      { id: "task-11", userId: session.user.id, title: "Создайте вторую карту", description: "Оформите дополнительную карту любого тарифа", reward: "300 баллов", rewardPoints: 300, progress: 0, total: 1, type: "special", completed: false },
      { id: "task-12", userId: session.user.id, title: "Оплатите коммунальные услуги", description: "Оплатите ЖКХ через приложение Маннру", reward: "200 баллов", rewardPoints: 200, progress: 0, total: 1, type: "special", completed: false },
    ];
    db.tasks.push(...defaultTasks);
    writeDb(db);
    tasks = defaultTasks;
  }
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDb();
  const body = await req.json();
  const task: Task = {
    id: crypto.randomUUID(),
    userId: session.user.id,
    title: body.title,
    description: body.description,
    reward: body.reward,
    rewardPoints: body.rewardPoints,
    progress: body.progress ?? 0,
    total: body.total,
    type: body.type || "daily",
    completed: false,
  };
  db.tasks.push(task);
  writeDb(db);
  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDb();
  const body = await req.json();
  const idx = db.tasks.findIndex((t: any) => t.id === body.id && t.userId === session.user.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.tasks[idx] = { ...db.tasks[idx], ...body };
  writeDb(db);
  return NextResponse.json(db.tasks[idx]);
}
