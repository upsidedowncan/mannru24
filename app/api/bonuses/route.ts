import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, Bonus, logClick } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDb();
  logClick(db, session.user.id, "Просмотр списка бонусов");
  let bonuses = db.bonuses.filter(b => b.userId === session.user.id);

  if (bonuses.length === 0) {
    const defaultBonuses: Bonus[] = [
      { id: "bonus-1", userId: session.user.id, title: "Кэшбэк 10% на рестораны", description: "Повышенный кэшбэк при оплате в ресторанах-партнёрах", points: 500, category: "Кэшбэк", expires: "3 дня", activated: false },
      { id: "bonus-2", userId: session.user.id, title: "Бесплатная подписка 3 месяца", description: "Бесплатная подписка на музыку при оплате картой Маннру", points: 300, category: "Акции", expires: "7 дней", activated: false },
      { id: "bonus-3", userId: session.user.id, title: "Двойные бонусы за АЗС", description: "2x бонусные баллы при оплате на заправках", points: 800, category: "Кэшбэк", expires: "5 дней", activated: false },
      { id: "bonus-4", userId: session.user.id, title: "Скидка 30% на первую доставку", description: "Скидка на первый заказ в сервисе доставки", points: 400, category: "Акции", expires: "14 дней", activated: false },
      { id: "bonus-5", userId: session.user.id, title: "Кэшбэк 5% на развлечения", description: "Повышенный кэшбэк за кино, концерты и мероприятия", points: 600, category: "Кэшбэк", expires: "10 дней", activated: false },
      { id: "bonus-6", userId: session.user.id, title: "Розыгрыш 100 000 МР", description: "Участвуйте в розыгрыше при оплате любой покупки от 500 МР", points: 1000, category: "Акции", expires: "30 дней", activated: false },
    ];
    db.bonuses.push(...defaultBonuses);
    writeDb(db);
    bonuses = defaultBonuses;
  }
  return NextResponse.json(bonuses);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDb();
  const body = await req.json();
  const bonus: Bonus = {
    id: crypto.randomUUID(),
    userId: session.user.id,
    title: body.title,
    description: body.description,
    points: body.points,
    category: body.category,
    expires: body.expires,
    activated: false,
  };
  db.bonuses.push(bonus);
  writeDb(db);
  return NextResponse.json(bonus, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDb();
  const body = await req.json();
  const idx = db.bonuses.findIndex((b) => b.id === body.id && b.userId === session.user.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userIdx = db.users.findIndex(u => u.id === session.user.id);
  if (userIdx === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (body.activated && !db.bonuses[idx].activated) {
    logClick(db, session.user.id, `Активация бонуса: ${db.bonuses[idx].title}`);
    db.users[userIdx].bonusBalance -= db.bonuses[idx].points;
  }
  db.bonuses[idx] = { ...db.bonuses[idx], ...body };
  writeDb(db);
  return NextResponse.json(db.bonuses[idx]);
}
