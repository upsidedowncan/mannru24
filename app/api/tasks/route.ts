import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

function ensureSeed() {
  const db = readDb();
  if (db.tasks.length === 0) {
    db.user = {
      name: "Александр",
      phone: "+7 (999) 123-45-67",
      bonusBalance: 12450,
      totalEarned: 16650,
      totalSpent: 8450,
      streak: 7,
      level: 1,
      xp: 0,
    };
    db.cards = [
      { id: "card-1", tier: "black", number: "•••• •••• •••• 4829", holder: "ALEKSANDR IVANOV", balance: 284520, expiry: "12/28", createdAt: new Date().toISOString() },
      { id: "card-2", tier: "gold", number: "•••• •••• •••• 7156", holder: "ALEKSANDR IVANOV", balance: 52340, expiry: "08/27", createdAt: new Date().toISOString() },
      { id: "card-3", tier: "silver", number: "•••• •••• •••• 3921", holder: "ALEKSANDR IVANOV", balance: 12890, expiry: "03/26", createdAt: new Date().toISOString() },
    ];
    db.transactions = [
      { id: "tx-1", name: "Яндекс Маркет", category: "Покупки", amount: -3450, date: "18 мая, 14:32" },
      { id: "tx-2", name: "Зарплата ООО Техно", category: "Доход", amount: 85000, date: "18 мая, 10:00" },
      { id: "tx-3", name: "Сбермаркет", category: "Продукты", amount: -2180, date: "17 мая, 19:45" },
      { id: "tx-4", name: "Netflix", category: "Развлечения", amount: -1290, date: "17 мая, 12:00" },
      { id: "tx-5", name: "Перевод от Алексей К.", category: "Переводы", amount: 5000, date: "16 мая, 16:20" },
      { id: "tx-6", name: "Яндекс Такси", category: "Транспорт", amount: -520, date: "16 мая, 09:15" },
      { id: "tx-7", name: "Кофейня Surf", category: "Рестораны", amount: -450, date: "16 мая, 08:30" },
      { id: "tx-8", name: "ЖКХ Квартира", category: "ЖКХ", amount: -4850, date: "15 мая, 11:00" },
      { id: "tx-9", name: "Wildberries", category: "Покупки", amount: -6720, date: "14 мая, 20:10" },
      { id: "tx-10", name: "Кэшбэк за май", category: "Доход", amount: 4280, date: "14 мая, 00:00" },
    ];
    db.tasks = [
      { id: "task-1", title: "Оплатите 3 покупки картой", description: "Совершите 3 любые оплаты картой Маннру сегодня", reward: "50 баллов", rewardPoints: 50, progress: 2, total: 3, type: "daily", completed: false },
      { id: "task-2", title: "Пополните счёт на 10 000 МР", description: "Пополните баланс вашей карты на сумму от 10 000 МР", reward: "200 баллов", rewardPoints: 200, progress: 10000, total: 10000, type: "daily", completed: true },
      { id: "task-3", title: "Переведите 1 000 МР другу", description: "Сделайте перевод любому контакту на сумму от 1 000 МР", reward: "100 баллов", rewardPoints: 100, progress: 0, total: 1000, type: "daily", completed: false },
      { id: "task-4", title: "Оплатите покупку через QR", description: "Используйте QR-код для оплаты в магазине", reward: "75 баллов", rewardPoints: 75, progress: 0, total: 1, type: "daily", completed: false },
      { id: "task-5", title: "Пригласите друга", description: "Отправьте приглашение другу и получите бонус", reward: "500 баллов", rewardPoints: 500, progress: 0, total: 1, type: "weekly", completed: false },
      { id: "task-6", title: "Оплатите 10 покупок за неделю", description: "Совершите 10 оплат картой в течение недели", reward: "300 баллов", rewardPoints: 300, progress: 7, total: 10, type: "weekly", completed: false },
      { id: "task-7", title: "Активируйте 2 бонуса", description: "Активируйте любые 2 бонуса из раздела бонусов", reward: "250 баллов", rewardPoints: 250, progress: 1, total: 2, type: "weekly", completed: false },
      { id: "task-8", title: "Войдите 7 дней подряд", description: "Откройте приложение каждый день в течение недели", reward: "150 баллов", rewardPoints: 150, progress: 5, total: 7, type: "weekly", completed: false },
      { id: "task-9", title: "Подключите автоплатёж", description: "Настройте автоматическую оплату для любого сервиса", reward: "1 000 баллов", rewardPoints: 1000, progress: 0, total: 1, type: "special", completed: false },
      { id: "task-10", title: "Потратьте 50 000 МР за месяц", description: "Достигните суммы расходов 50 000 МР за текущий месяц", reward: "2 000 баллов", rewardPoints: 2000, progress: 32500, total: 50000, type: "special", completed: false },
      { id: "task-11", title: "Создайте вторую карту", description: "Оформите дополнительную карту любого тарифа", reward: "300 баллов", rewardPoints: 300, progress: 0, total: 1, type: "special", completed: false },
      { id: "task-12", title: "Оплатите коммунальные услуги", description: "Оплатите ЖКХ через приложение Маннру", reward: "200 баллов", rewardPoints: 200, progress: 0, total: 1, type: "special", completed: false },
    ];
    db.bonuses = [
      { id: "bonus-1", title: "Кэшбэк 10% на рестораны", description: "Повышенный кэшбэк при оплате в ресторанах-партнёрах", points: 500, category: "Кэшбэк", expires: "3 дня", activated: false },
      { id: "bonus-2", title: "Бесплатная доставка", description: "Бесплатная доставка от Яндекс Маркет при оплате картой Маннру", points: 300, category: "Партнёры", expires: "7 дней", activated: true },
      { id: "bonus-3", title: "Двойные бонусы за АЗС", description: "2x бонусные баллы при оплате на заправках", points: 800, category: "Кэшбэк", expires: "5 дней", activated: false },
      { id: "bonus-4", title: "Скидка 20% на такси", description: "Скидка на первые 5 поездок в Яндекс Такси", points: 400, category: "Партнёры", expires: "14 дней", activated: false },
      { id: "bonus-5", title: "Кэшбэк 5% на развлечения", description: "Повышенный кэшбэк за кино, концерты и мероприятия", points: 600, category: "Кэшбэк", expires: "10 дней", activated: true },
      { id: "bonus-6", title: "Промокод Ozon - 500 МР", description: "Промокод на скидку при заказе от 2000 МР", points: 1000, category: "Партнёры", expires: "30 дней", activated: false },
    ];
    writeDb(db);
  }
  return db;
}

export async function GET() {
  const db = ensureSeed();
  return NextResponse.json(db.tasks);
}

export async function POST(req: Request) {
  const db = ensureSeed();
  const body = await req.json();
  const task = {
    id: crypto.randomUUID(),
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
  const db = ensureSeed();
  const body = await req.json();
  const idx = db.tasks.findIndex((t: any) => t.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.tasks[idx] = { ...db.tasks[idx], ...body };
  writeDb(db);
  return NextResponse.json(db.tasks[idx]);
}
