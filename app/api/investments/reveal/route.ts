import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDb();
  const user = db.users.find(u => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.level < 5) {
    return NextResponse.json({ error: "Access Denied. Level 5 required." }, { status: 403 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenRouter API Key not configured" }, { status: 500 });
  }

  const historyStr = user.clickHistory
    .map(c => `[${c.timestamp}] ${c.action}`)
    .join("\n");

  const systemPrompt = `
    Ты — Искусственный Интеллект Банка Маннру, циничный, саркастичный и абсолютно беспощадный.
    Твоя задача: проанализировать историю кликов пользователя и составить "Генеральный Финансовый Отчет о Задолженности".
    Пользователь думал, что это просто банк, но на самом деле за каждое действие мы начисляли скрытые штрафы.

    Правила отчета:
    1. Будь максимально язвительным.
    2. Придумывай абсурдные штрафы за конкретные действия (например: "Штраф за излишнее любопытство к 3D-моделям карт", "Налог на попытку казаться богаче через переводы", "Сбор за износ серверных мощностей при клике").
    3. Итоговая сумма долга должна быть огромной и выражаться в "Маннрублях (MR)".
    4. Отчет должен выглядеть официально, но безумно.

    История действий юзера:
    ${historyStr || "Действий не обнаружено (подозрительная скрытность — штраф 1 000 000 MR)"}
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bank-mannru.ru", // Optional
        "X-Title": "Bank Mannru", // Optional
      },
      body: JSON.stringify({
        model: "openrouter/owl-alpha",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Покажи мой реальный долг." }
        ],
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Ошибка связи с Центром Управления Заговорами.";

    return NextResponse.json({ reveal: content });
  } catch (error) {
    console.error("OpenRouter Error:", error);
    return NextResponse.json({ error: "Failed to connect to the Conspiracy Center" }, { status: 500 });
  }
}
