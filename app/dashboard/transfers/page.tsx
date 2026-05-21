"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Smile, Copy, Check, Lock } from "lucide-react";
import { withAccess } from "@/components/AccessGuard";
import type { Transaction, Card as CardType } from "@/lib/db";
import { tierMeta } from "@/components/BankCard";
import { useProgression } from "@/lib/progression";

const quickEmojis = ["🐶","🐱","🐰","🦊","🐻","🐼","🐯","🐮","🐷","🐸","🦄","🐝","🦋","🐢","🐍","🐙","🦈","🐊","🐘","🦒"];

function TransfersPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [amount, setAmount] = useState("");
  const [emojiCode, setEmojiCode] = useState("");
  const [sending, setSending] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { triggerLevelUps } = useProgression();

  useEffect(() => {
    fetch("/api/cards").then((r) => r.json()).then(setCards);
    fetch("/api/transactions?limit=10").then((r) => r.json()).then(setTransactions);
  }, []);

  const handleSend = async () => {
    if (!emojiCode || !amount) return;
    setSending(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `Перевод ${emojiCode}`, category: "Переводы", amount: -parseFloat(amount), emojiCode }),
    });
    const data = await res.json();
    if (data.levelUps?.length) {
      triggerLevelUps(data.levelUps, data.level, data.xp, data.currentXp, data.nextXp);
    }
    if (data.completedTasks?.length) setCompletedTasks(data.completedTasks);
    setEmojiCode(""); setAmount("");
    const txRes = await fetch("/api/transactions?limit=10");
    setTransactions(await txRes.json());
    setSending(false);
    setTimeout(() => setCompletedTasks([]), 4000);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const emojiCards = cards.filter((c) => ["gold","platinum","titanium","ruby","emerald","sapphire","diamond","black","obsidian"].includes(c.tier));
  const basicCards = cards.filter((c) => !["gold","platinum","titanium","ruby","emerald","sapphire","diamond","black","obsidian"].includes(c.tier));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Переводы</h1><p className="text-muted-foreground text-sm mt-1">Мгновенные переводы по emoji-коду</p></div>

      {completedTasks.length > 0 && (
        <Card className="border-emerald-500/50 bg-emerald-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center"><Smile className="w-5 h-5 text-emerald-500" /></div>
              <div><p className="font-medium text-emerald-500">Задание выполнено!</p><p className="text-sm text-muted-foreground">Вам начислены бонусные баллы</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Отправить по emoji-коду</CardTitle><CardDescription>Введите emoji-код получателя и сумму</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Emoji-код получателя</Label>
            <Input value={emojiCode} onChange={(e) => setEmojiCode(e.target.value)} placeholder="🐶" className="text-2xl" />
            <div className="flex gap-1.5 flex-wrap">
              {quickEmojis.map((e) => (
                <button key={e} onClick={() => setEmojiCode((prev) => prev + e)} className="w-9 h-9 rounded-lg bg-secondary hover:bg-accent transition-colors text-lg flex items-center justify-center">
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Сумма</Label>
            <div className="relative">
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="text-2xl font-bold pr-12 h-14" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">МР</span>
            </div>
          </div>
          <div className="flex gap-2">
            {["100", "500", "1000", "5000"].map((v) => (
              <Button key={v} variant="secondary" size="sm" onClick={() => setAmount(v)}>{v} МР</Button>
            ))}
          </div>
          <Separator />
          <Button variant="gradient" className="w-full gap-2" onClick={handleSend} disabled={sending || !amount || !emojiCode}>
            {sending ? "Отправка..." : `Отправить ${emojiCode}`} <ArrowUpRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Мой emoji-код</CardTitle><CardDescription>Доступно с тарифа Gold и выше</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {emojiCards.map((card) => (
            <div key={card.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-2xl">{card.emojiCode}</div>
                <div>
                  <p className="text-sm font-medium">{card.holder}</p>
                  <p className="text-xs text-muted-foreground">{tierMeta[card.tier].label} ••{card.number.slice(-4)}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => card.emojiCode && copyCode(card.emojiCode, card.id)}>
                {copiedId === card.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === card.id ? "Скопировано" : "Копировать"}
              </Button>
            </div>
          ))}
          {basicCards.length > 0 && (
            <div className="space-y-2">
              {basicCards.map((card) => (
                <div key={card.id} className="flex items-center justify-between p-3 rounded-lg border opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center"><Lock className="w-5 h-5 text-muted-foreground" /></div>
                    <div>
                      <p className="text-sm font-medium">{card.holder}</p>
                      <p className="text-xs text-muted-foreground">{tierMeta[card.tier].label} ••{card.number.slice(-4)}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Gold+</Badge>
                </div>
              ))}
            </div>
          )}
          {cards.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Создайте карту Gold или выше, чтобы получить emoji-код</p>}
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Последние операции</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((tx, i, arr) => (
                <div key={tx.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(tx as any).emojiCode && <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg">{(tx as any).emojiCode}</div>}
                      <div><p className="text-sm font-medium">{tx.name}</p><p className="text-xs text-muted-foreground">{tx.category}</p></div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${tx.amount > 0 ? "text-emerald-500" : ""}`}>{tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("ru")} МР</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  {i < arr.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
export default withAccess(TransfersPage, "/dashboard/transfers");
