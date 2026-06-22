import { NextResponse } from "next/server";
import { readDb, writeDb, logClick, addXp, Database } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Rate change outcomes with their weights and payouts
const OUTCOMES = [
  { id: "hold",      label: "Без изменений",  delta: 0,     weight: 50, payout: 1.5  },
  { id: "up25",      label: "+0.25%",          delta: 0.25,  weight: 20, payout: 2.5  },
  { id: "up50",      label: "+0.5%",           delta: 0.5,   weight: 8,  payout: 5.0  },
  { id: "down25",    label: "-0.25%",          delta: -0.25, weight: 20, payout: 2.5  },
  { id: "down50",    label: "-0.5%",           delta: -0.5,  weight: 8,  payout: 5.0  },
  { id: "crisis",   label: "Кризис!",          delta: 2.0,   weight: 2,  payout: 12.0 },
] as const;

type OutcomeId = typeof OUTCOMES[number]["id"];

function pickOutcome() {
  const total = OUTCOMES.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of OUTCOMES) {
    r -= o.weight;
    if (r <= 0) return o;
  }
  return OUTCOMES[0];
}

function initCbRate(db: Database) {
  if (!db.cbRate) {
    (db as any).cbRate = {
      currentRate: 16.0,
      quarter: 1,
      year: 2025,
      history: [{ quarter: "Q1 2025", rate: 16.0 }],
    };
  }
}

// GET — return current rate state (no auth needed for display)
export async function GET() {
  const db = readDb();
  initCbRate(db);
  writeDb(db);
  return NextResponse.json((db as any).cbRate);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { bet, cardId, prediction } = body as { bet: number; cardId: string; prediction: OutcomeId };

  if (!bet || bet <= 0) return NextResponse.json({ error: "Неверная ставка" }, { status: 400 });
  if (!OUTCOMES.find(o => o.id === prediction))
    return NextResponse.json({ error: "Неверный прогноз" }, { status: 400 });

  const db = readDb();
  initCbRate(db);

  const user = db.users.find(u => u.id === session.user.id);
  const card = db.cards.find(c => c.id === cardId && c.userId === session.user.id);

  if (!user || !card) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  if (card.balance < bet) return NextResponse.json({ error: "Недостаточно средств" }, { status: 400 });

  const outcome = pickOutcome();
  const won = outcome.id === prediction;

  card.balance -= bet;

  let winnings = 0;
  if (won) {
    winnings = Math.round(bet * outcome.payout);
    card.balance += winnings;
    user.totalEarned += winnings;
    logClick(db, user.id, `Выиграл в Ставке ЦБ: +${winnings} МР (${outcome.label}, ставка x${outcome.payout})`);
  } else {
    user.totalSpent += bet;
    logClick(db, user.id, `Проиграл в Ставке ЦБ: -${bet} МР (прогноз не совпал, вышло ${outcome.label})`);
  }

  // Advance the economic calendar
  const cbRate = (db as any).cbRate;
  cbRate.currentRate = Math.max(1, Math.round((cbRate.currentRate + outcome.delta) * 100) / 100);
  cbRate.quarter = cbRate.quarter === 4 ? 1 : cbRate.quarter + 1;
  if (cbRate.quarter === 1) cbRate.year += 1;
  const quarterLabel = `Q${cbRate.quarter} ${cbRate.year}`;
  cbRate.history.push({ quarter: quarterLabel, rate: cbRate.currentRate });
  if (cbRate.history.length > 20) cbRate.history.shift();

  addXp(db, user.id, 3);
  writeDb(db);

  // Build flavor text
  const flavors: Record<OutcomeId, string> = {
    hold:   "Совет директоров, оценив инфляционные риски и геополитическую нестабильность, принял решение сохранить ключевую ставку без изменений.",
    up25:   "В целях ограничения инфляционного давления Банк Маннру повысил ключевую ставку на 25 базисных пунктов.",
    up50:   "Ввиду ускорения инфляции выше целевого уровня Банк Маннру принял решение о внеплановом повышении ставки на 50 б.п.",
    down25: "Признавая замедление инфляции и необходимость поддержки экономического роста, Банк Маннру снизил ставку на 0.25%.",
    down50: "На фоне рецессионных сигналов Совет директоров принял решение об агрессивном снижении ставки на 50 б.п.",
    crisis: "⚠️ ЭКСТРЕННОЕ ЗАСЕДАНИЕ. В условиях системного финансового кризиса Банк Маннру повысил ключевую ставку до экстремального уровня. Все вклады заморожены на 72 часа. Не паникуйте.",
  };

  return NextResponse.json({
    outcome,
    won,
    winnings,
    newBalance: card.balance,
    newRate: cbRate.currentRate,
    quarterLabel,
    history: cbRate.history,
    flavorText: flavors[outcome.id],
  });
}
