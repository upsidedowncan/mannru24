"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RiSendPlaneLine, RiUserLine, RiInformationLine, RiBankCardLine } from "react-icons/ri";
import { toast } from "sonner";
import type { Card as CardType } from "@/lib/db";
import { useRouter } from "next/navigation";
import { tierMeta } from "@/components/BankCard";
import { withAccess } from "@/components/AccessGuard";

function TransfersPage() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetCode, setTargetCode] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/cards")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCards(data);
          if (data.length > 0) setSelectedCardId(data[0].id);
        }
        setLoading(false);
      });
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardId || !targetCode || !amount) return;
    setSending(true);

    try {
      const res = await fetch("/api/transactions/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromCardId: selectedCardId,
          toEmojiCode: targetCode,
          amount: parseFloat(amount),
          description: "Перевод по emoji-коду",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Перевод успешно выполнен!");
        setAmount("");
        setTargetCode("");
        // Refresh cards
        const cardsRes = await fetch("/api/cards");
        const cardsData = await cardsRes.json();
        setCards(cardsData);
      } else {
        toast.error(data.error || "Ошибка перевода");
      }
    } catch (err) {
      toast.error("Сетевая ошибка");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="space-y-6"><div className="h-8 w-48 bg-secondary rounded animate-pulse" /><div className="h-[400px] bg-secondary rounded-xl animate-pulse" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Переводы</h1>
        <p className="text-muted-foreground text-sm mt-1">Мгновенные переводы по emoji-коду</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RiSendPlaneLine className="w-5 h-5 text-primary" /> Новый перевод
          </CardTitle>
          <CardDescription>Введите код получателя и сумму перевода</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTransfer} className="space-y-6">
            <div className="space-y-2">
              <Label>Списать с карты</Label>
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Выберите карту" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-sm ${tierMeta[card.tier].gradient}`} />
                        <span>{tierMeta[card.tier].label} ••{card.number.slice(-4)}</span>
                        <span className="ml-2 text-muted-foreground">({card.balance.toLocaleString("ru")} МР)</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Emoji-код получателя</Label>
              <div className="relative">
                <Input
                  id="target"
                  placeholder="🦒🐼🐦🦁"
                  value={targetCode}
                  onChange={(e) => setTargetCode(e.target.value)}
                  className="h-12 pl-10"
                />
                <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 px-1">
                <RiInformationLine className="w-3 h-3" /> Код состоит из 4-х эмодзи
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Сумма перевода (МР)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 pl-10"
                />
                <RiBankCardLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold" variant="gradient" disabled={sending}>
              {sending ? "Отправка..." : "Отправить деньги"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <RiInformationLine className="w-5 h-5 text-blue-500 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-400">Безопасные переводы</p>
              <p className="text-xs text-blue-500/70 leading-relaxed">
                Все переводы внутри системы Маннру Банк осуществляются мгновенно и без комиссии для большинства тарифов.
                Будьте внимательны при вводе emoji-кода получателя.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAccess(TransfersPage, "/dashboard/transfers");
