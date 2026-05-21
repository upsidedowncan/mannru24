"use client";

import { useEffect, useState } from "react";
import { BankCard, tierMeta } from "@/components/BankCard";
import { CreateCardDialog } from "@/components/CreateCardDialog";
import { UpgradeCardDialog } from "@/components/UpgradeCardDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Check, CreditCard, Trash2 } from "lucide-react";
import type { Card as CardType, CardTier } from "@/lib/db";

const tierOrder: CardTier[] = ["bronze", "silver", "gold", "platinum", "titanium", "ruby", "emerald", "sapphire", "diamond", "black", "obsidian"];

const tierInfo = [
  { tier: "bronze" as const, name: "Bronze", features: ["Бесплатное обслуживание", "Кэшбэк 0.5% на все покупки", "Базовая поддержка"] },
  { tier: "silver" as const, name: "Silver", features: ["Бесплатное обслуживание", "Кэшбэк 1% на все покупки", "Переводы до 100 000 МР без комиссии", "Снятие наличных без комиссии"] },
  { tier: "gold" as const, name: "Gold", features: ["Всё из Silver", "Кэшбэк 3% на выбранные категории", "Приоритетная поддержка 24/7", "Бесплатная страховка путешествий", "Переводы без лимита"] },
  { tier: "platinum" as const, name: "Platinum", features: ["Всё из Gold", "Кэшбэк 5% на все покупки", "Бесплатный доступ в бизнес-залы", "Расширенная страховка", "Консьерж-сервис", "Сниженная ставка по кредитам"] },
  { tier: "titanium" as const, name: "Titanium", features: ["Всё из Platinum", "Кэшбэк 6% на все покупки", "Увеличенные лимиты", "Премиальная поддержка"] },
  { tier: "ruby" as const, name: "Ruby", features: ["Всё из Titanium", "Кэшбэк 7% на все покупки", "Доступ в VIP-залы", "Персональные предложения"] },
  { tier: "emerald" as const, name: "Emerald", features: ["Всё из Ruby", "Кэшбэк 8% на все покупки", "Расширенная страховка имущества", "Приоритетное обслуживание"] },
  { tier: "sapphire" as const, name: "Sapphire", features: ["Всё из Emerald", "Кэшбэк 9% на все покупки", "Бесплатные переводы worldwide", "Эксклюзивные мероприятия"] },
  { tier: "diamond" as const, name: "Diamond", features: ["Всё из Sapphire", "Кэшбэк 10% на все покупки", "Персональный банкир", "Премиальная страховка"] },
  { tier: "black" as const, name: "Black", features: ["Всё из Diamond", "Кэшбэк 12% на все покупки", "Персональный менеджер", "VIP доступ в рестораны и клубы", "Безлимитные переводы worldwide"] },
  { tier: "obsidian" as const, name: "Obsidian", features: ["Всё из Black", "Кэшбэк 15% на все покупки", "Максимальные лимиты", "Приглашения на закрытые события", "Полная финансовая свобода"] },
];

export default function CardsPage() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCards = async () => {
    setLoading(true);
    const res = await fetch("/api/cards");
    const data = await res.json();
    setCards(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const deleteCard = async () => {
    if (!deleteId) return;
    await fetch(`/api/cards?id=${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchCards();
  };

  const cardLabels = cards.map((c) => ({ id: c.id, tier: c.tier, balance: c.balance, label: `${tierMeta[c.tier].label} ••${c.number.slice(-4)}` }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Карты</h1>
          <p className="text-muted-foreground text-sm mt-1">{cards.length} карт</p>
        </div>
        <CreateCardDialog onCreated={fetchCards} existingCards={cardLabels} />
      </div>

      {cards.length > 0 ? (
        <ScrollArea className="w-full pb-2">
          <div className="flex gap-4 w-max">
            {cards.map((card) => (
              <div key={card.id} className="relative group">
                <BankCard
                  tier={card.tier}
                  number={card.number}
                  holder={card.holder}
                  balance={card.balance}
                  expiry={card.expiry}
                  emojiCode={card.emojiCode}
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <UpgradeCardDialog card={card} allCards={cardLabels} onUpgraded={fetchCards} />
                  <button
                    onClick={() => setDeleteId(card.id)}
                    className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center py-12">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">У вас пока нет карт</h3>
            <p className="text-muted-foreground text-sm mb-4">Создайте свою первую карту и получите 1 000 МР</p>
            <CreateCardDialog onCreated={fetchCards} existingCards={cardLabels} />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Все тарифы</TabsTrigger>
          <TabsTrigger value="compare">Сравнение</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tierInfo.map((tier) => {
              const meta = tierMeta[tier.tier];
              return (
                <Card key={tier.tier} className="flex flex-col transition-all hover:shadow-lg hover:shadow-black/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${meta.gradient} ring-1 ${meta.ring} flex items-center justify-center shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_2px_4px_0_rgba(0,0,0,0.2)]`}>
                        <CreditCard className="w-5 h-5 text-white/80" />
                      </div>
                      <div>
                        <CardTitle>{meta.label}</CardTitle>
                        <CardDescription>{meta.price}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-4 p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Кэшбэк</p>
                      <p className="text-2xl font-bold">{meta.cashback}</p>
                    </div>
                    <ul className="space-y-2">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <CreateCardDialog onCreated={fetchCards} existingCards={cardLabels} />
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="compare" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="w-full">
                <div className="min-w-[600px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Функция</th>
                        {tierOrder.map((t) => (
                          <th key={t} className="text-center py-3 px-3">
                            <div className="flex flex-col items-center gap-1.5">
                              <div className={`w-6 h-6 rounded-sm ${tierMeta[t].gradient} ring-1 ring-white/10`} />
                              <span className="text-xs">{tierMeta[t].label}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { feature: "Цена", values: tierOrder.map((t) => tierMeta[t].price) },
                        { feature: "Кэшбэк", values: tierOrder.map((t) => tierMeta[t].cashback) },
                      ].map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-3 px-4 font-medium">{row.feature}</td>
                          {row.values.map((v, j) => (
                            <td key={j} className="text-center py-3 px-3 text-muted-foreground text-xs">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить карту?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Карта будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCard} className="bg-red-600 hover:bg-red-700">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
