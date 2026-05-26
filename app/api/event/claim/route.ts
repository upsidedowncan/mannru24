import { NextResponse } from "next/server";
import { readDb, writeDb, logClick, addXp } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isEventActive } from "@/lib/events";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isEventActive("kurban")) {
    return NextResponse.json({ error: "Event is not active" }, { status: 403 });
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!user.claimedGifts) user.claimedGifts = [];

  if (user.claimedGifts.includes("kurban-2026")) {
    return NextResponse.json({ error: "Gift already claimed" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const isCalculationOnly = body.calculateOnly === true;

  // Prepare AI prompt
  const historyStr = user.clickHistory?.map(c => `[${c.timestamp}] ${c.action}`).join("\n") || "Нет данных";
  const stats = `Имя: ${user.name}, Уровень: ${user.level}, Баланс: ${user.bonusBalance}, Стрик: ${user.streak}`;

  const systemPrompt = `
    Ты — "Маннру Алгоритм Распределения Барашков". Твоя задача: на основе профиля и истории кликов пользователя Курбан-байрам определить, сколько барашков он заслужил.

    КРИТЕРИИ:
    1. Новичкам (уровень 1-5) давай МНОГО барашков (от 10 до 20).
    2. Профи (уровень 10+) давай МАЛО барашков (от 1 до 5), аргументируя это их "капиталистической зажранностью".
    3. Стрик (серия дней) увеличивает количество барашков.
    4. За подозрительные или "бесполезные" клики в истории — снижай количество.

    ФОРМАТ ОТВЕТА:
    JSON объект:
    {
      "sheepCount": число,
      "reason": "короткое саркастичное объяснение на русском языке"
    }
    Никакого лишнего текста, только JSON.
  `;

  let sheepCount = 1;
  let reason = "Стандартный барашек за лояльность.";

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (apiKey) {
    try {
      const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openrouter/owl-alpha",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Проанализируй меня: ${stats}\nИстория:\n${historyStr}` }
          ],
          response_format: { type: "json_object" }
        })
      });
      const aiData = await aiRes.json();
      const aiResult = JSON.parse(aiData.choices?.[0]?.message?.content || "{}");
      if (aiResult.sheepCount) {
        sheepCount = aiResult.sheepCount;
        reason = aiResult.reason;
      }
    } catch (e) {
      console.error("AI sheep calc failed:", e);
      // Fallback logic
      sheepCount = user.level < 5 ? 15 : 3;
    }
  } else {
    // Fallback logic without API key
    sheepCount = user.level < 5 ? 12 : 2;
    reason = user.level < 5 ? "Ты еще маленький, тебе нужно больше мяса." : "У тебя и так много денег, делись с другими.";
  }

  const giftAmount = sheepCount * 500;
  const xpAmount = sheepCount * 10;

  if (isCalculationOnly) {
    return NextResponse.json({
      sheepCount,
      giftAmount,
      xpAmount,
      reason
    });
  }

  // Award gift
  user.bonusBalance += giftAmount;
  user.totalEarned += giftAmount;
  user.claimedGifts.push("kurban-2026");

  const levelUps = addXp(db, user.id, xpAmount);

  logClick(db, user.id, `Получение ${sheepCount} барашков на Курбан-байрам`);
  writeDb(db);

  return NextResponse.json({
    message: "Gift claimed successfully",
    sheepCount,
    giftAmount,
    xpAmount,
    reason,
    levelUps,
  });
}
