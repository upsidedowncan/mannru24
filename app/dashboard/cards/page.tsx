"use client";

import { useEffect, useState, useRef } from "react";
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
import { RiCheckboxCircleFill, RiIdCardLine, RiDeleteBinLine, RiArrowLeftSLine, RiArrowRightSLine, RiCheckboxBlankCircleLine } from "react-icons/ri";
import type { Card as CardType, CardTier } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/lib/utils";
import { useProgression } from "@/lib/progression";
import { toast } from "sonner";

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

function TariffCarousel({ onSelect, existingCards, isReadOnly }: { onSelect: () => void, existingCards: any[], isReadOnly?: boolean }) {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((prev) => (prev + 1) % tierInfo.length);
  const prev = () => setIndex((prev) => (prev - 1 + tierInfo.length) % tierInfo.length);

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden perspective-[1200px]">
      <div className="absolute top-1/2 left-4 z-20 -translate-y-1/2">
        <Button variant="outline" size="icon" className="rounded-full bg-zinc-900/50 border-zinc-800" onClick={prev}>
          <RiArrowLeftSLine className="w-6 h-6" />
        </Button>
      </div>
      <div className="absolute top-1/2 right-4 z-20 -translate-y-1/2">
        <Button variant="outline" size="icon" className="rounded-full bg-zinc-900/50 border-zinc-800" onClick={next}>
          <RiArrowRightSLine className="w-6 h-6" />
        </Button>
      </div>

      <div className="relative w-full h-full flex items-center justify-center transform-style-3d">
        {tierInfo.map((tier, i) => {
          const offset = i - index;
          // Loop around for infinite feel
          let normalizedOffset = offset;
          if (offset > tierInfo.length / 2) normalizedOffset -= tierInfo.length;
          if (offset < -tierInfo.length / 2) normalizedOffset += tierInfo.length;

          const isActive = normalizedOffset === 0;
          const absOffset = Math.abs(normalizedOffset);

          // Only show cards within a certain range
          if (absOffset > 3) return null;

          const isMobile = useMediaQuery("(max-width: 768px)");
          const xOffset = isMobile ? 160 : 220;
          const scaleFactor = isMobile ? 0.8 : 1;

          return (
            <motion.div
              key={tier.tier}
              initial={false}
              animate={{
                x: normalizedOffset * xOffset,
                scale: (1 - absOffset * 0.15) * scaleFactor,
                rotateY: normalizedOffset * -35,
                z: -absOffset * 150,
                opacity: 1 - absOffset * 0.2,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute cursor-pointer"
              style={{
                zIndex: 10 - absOffset,
              }}
              onClick={() => setIndex(i)}
            >
              <div className="relative group">
                <BankCard
                  tier={tier.tier}
                  number="•••• •••• •••• 0000"
                  holder="MANNRU CLIENT"
                  balance={0}
                  expiry="12/30"
                  emojiCode="🏦🤡💸🔥"
                />
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-24 left-0 right-0 text-center space-y-2 pointer-events-none"
                  >
                    <h3 className="text-xl font-bold text-white uppercase tracking-widest">{tierMeta[tier.tier].label}</h3>
                    <p className="text-blue-400 text-sm font-mono">{tierMeta[tier.tier].price}</p>
                    {!isReadOnly && (
                      <div className="pt-2 pointer-events-auto">
                        <CreateCardDialog onCreated={onSelect} existingCards={existingCards} />
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function CardsPage() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { isReadOnly } = useProgression();

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cards");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setCards(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch cards:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const deleteCards = async () => {
    if (deleteIds.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/cards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: deleteIds }),
      });
      if (res.ok) {
        toast.success(deleteIds.length === 1 ? "Карта удалена" : `Удалено карт: ${deleteIds.length}`);
        setSelectedIds((prev) => prev.filter((id) => !deleteIds.includes(id)));
        fetchCards();
      } else {
        toast.error("Ошибка при удалении");
      }
    } catch (error) {
      toast.error("Сетевая ошибка");
    } finally {
      setIsDeleting(false);
      setDeleteIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.length === cards.length ? [] : cards.map((c) => c.id)
    );
  };

  const cardLabels = cards.map((c) => ({ id: c.id, tier: c.tier, balance: c.balance, label: `${tierMeta[c.tier]?.label || c.tier} ••${c.number.slice(-4)}` }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Карты</h1>
          <p className="text-muted-foreground text-sm mt-1">{cards.length} активных карт</p>
        </div>
      </div>

      <Tabs defaultValue="tariffs" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
          <TabsTrigger value="my">Мои карты</TabsTrigger>
          <TabsTrigger value="tariffs">Тарифы 3D</TabsTrigger>
          <TabsTrigger value="compare">Сравнение</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="mt-6">
          {cards.length > 0 ? (
            <div className="space-y-6">
              {!isReadOnly && (
                <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.length === cards.length ? "bg-blue-600 border-blue-600" : "border-zinc-700"}`}>
                        {selectedIds.length === cards.length && <RiCheckboxCircleFill className="w-4 h-4 text-white" />}
                      </div>
                      Выбрать все
                    </button>
                    {selectedIds.length > 0 && (
                      <span className="text-sm text-zinc-500">{selectedIds.length} выбрано</span>
                    )}
                  </div>
                  {selectedIds.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 gap-2"
                      onClick={() => setDeleteIds(selectedIds)}
                    >
                      <RiDeleteBinLine className="w-4 h-4" /> Удалить выбранные
                    </Button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                  <div key={card.id} className="relative group">
                    <div
                      onClick={() => !isReadOnly && toggleSelect(card.id)}
                      className={`cursor-pointer transition-all ${selectedIds.includes(card.id) ? "ring-2 ring-blue-600 ring-offset-4 ring-offset-black rounded-xl scale-[0.98]" : ""}`}
                    >
                      <BankCard
                        tier={card.tier}
                        number={card.number}
                        holder={card.holder}
                        balance={card.balance}
                        expiry={card.expiry}
                        emojiCode={card.emojiCode}
                      />
                    </div>
                    {!isReadOnly && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${selectedIds.includes(card.id) ? "bg-blue-600 text-white" : "bg-black/50 text-white"}`}>
                          <RiCheckboxCircleFill className="w-4 h-4" />
                        </div>
                        <UpgradeCardDialog card={card} allCards={cardLabels} onUpgraded={fetchCards} />
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteIds([card.id]); }}
                          className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <RiDeleteBinLine className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {!isReadOnly && cards.length < 25 && (
                  <div className="aspect-[1.586/1] border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center group hover:border-zinc-700 transition-colors cursor-pointer">
                    <CreateCardDialog onCreated={fetchCards} existingCards={cardLabels} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Card className="bg-zinc-950 border-zinc-900">
              <CardContent className="pt-6 flex flex-col items-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                  <RiIdCardLine className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="text-lg font-medium mb-1">У вас пока нет карт</h3>
                <p className="text-zinc-500 text-sm mb-4">Выберите подходящий тариф и начните тратить воображаемые деньги.</p>
                {!isReadOnly && <CreateCardDialog onCreated={fetchCards} existingCards={cardLabels} />}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tariffs" className="mt-6 border-none p-0">
          <TariffCarousel onSelect={fetchCards} existingCards={cardLabels} isReadOnly={isReadOnly} />

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
             {tierInfo.slice(0, 3).map(t => (
               <div key={t.tier} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                  <h4 className="font-bold text-white mb-2">{tierMeta[t.tier].label}</h4>
                  <ul className="space-y-1">
                    {t.features.map((f, i) => (
                      <li key={i} className="text-xs text-zinc-500 flex items-center gap-2">
                        <RiCheckboxCircleFill className="w-3 h-3 text-blue-500" /> {f}
                      </li>
                    ))}
                  </ul>
               </div>
             ))}
          </div>
        </TabsContent>

        <TabsContent value="compare" className="mt-6">
          <Card className="bg-zinc-950 border-zinc-900 overflow-hidden">
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <div className="min-w-[800px]">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/50">
                        <th className="text-left py-4 px-6 text-zinc-400 font-medium">Параметр</th>
                        {tierOrder.map((t) => (
                          <th key={t} className="text-center py-4 px-4">
                            <div className="flex flex-col items-center gap-2">
                              <div className={`w-8 h-5 rounded ${tierMeta[t].gradient} ring-1 ring-white/10`} />
                              <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-300">{tierMeta[t].label}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      <tr>
                        <td className="py-4 px-6 font-medium text-zinc-300 bg-zinc-900/20">Стоимость</td>
                        {tierOrder.map((t) => (
                          <td key={t} className="text-center py-4 px-4 text-zinc-500 text-xs">{tierMeta[t].price}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-4 px-6 font-medium text-zinc-300 bg-zinc-900/20">Кэшбэк</td>
                        {tierOrder.map((t) => (
                          <td key={t} className="text-center py-4 px-4 text-zinc-500 text-xs">{tierMeta[t].cashback}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-4 px-6 font-medium text-zinc-300 bg-zinc-900/20">Обслуживание</td>
                        {tierOrder.map((t) => (
                          <td key={t} className="text-center py-4 px-4 text-zinc-500 text-xs">Бесплатно*</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteIds.length > 0} onOpenChange={(open) => !open && setDeleteIds([])}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {deleteIds.length === 1 ? "Удалить карту?" : `Удалить ${deleteIds.length} карт?`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500">
              Это действие нельзя отменить. {deleteIds.length === 1 ? "Ваша элитная карта превратится" : "Ваши элитные карты превратятся"} в тыкву.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800">Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteCards}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
            >
              {isDeleting ? "Уничтожение..." : "Уничтожить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
