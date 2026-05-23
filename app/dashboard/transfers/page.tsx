"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Smile, Copy, Check, Lock, AlertCircle, Trash2, Plus } from "lucide-react";
import { withAccess } from "@/components/AccessGuard";
import { CreateCardDialog } from "@/components/CreateCardDialog";
import type { Transaction, Card as CardType } from "@/lib/db";
import { tierMeta } from "@/components/BankCard";
import { useProgression } from "@/lib/progression";
import { useRouter } from "next/navigation";

const quickEmojis = ["🦒","🐼","🐦","🦁","🦒","🐼","🐦","🦁","🦒","🐼","🐦","🦁","🦒","🐼","🐦","🦁","🦒","🐼","🐦","🦁"];

function TransfersPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [amount, setAmount] = useState("");
  const [emojiCode, setEmojiCode] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { triggerLevelUps } = useProgression();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const [cardsRes, txRes] = await Promise.all([
        fetch("/api/cards"),
        fetch("/api/transactions?limit=10")
      ]);

      if (cardsRes.status === 401 || txRes.status === 401) {
        router.push("/login");
        return;
      }

      const cardsData = await cardsRes.json();
      const txData = await txRes.json();

      setCards(Array.isArray(cardsData) ? cardsData : []);
      setTransactions(Array.isArray(txData) ? txData : []);
    };
    fetchData();
  }, [router]);

  // Validation: Address consists strictly of 4 emojis
  // We use a simple length check and emoji splitting for the UI
  const emojiArray = useMemo(() => {
    // This is a naive split, but good enough for the UI mask
    return Array.from(emojiCode);
  }, [emojiCode]);

  const isValid = emojiArray.length === 4;

  const handleSend = async () => {
    if (!isValid || !amount) {
      setError("Адрес получателя должен состоять ровно из 4-х эмодзи!");
      return;
    }
    setError(null);
    setSending(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Перевод по коду ${emojiCode}`,
        category: "Переводы",
        amount: -parseFloat(amount),
        emojiCode
      }),
    });
    const data = await res.json();

    if (res.status !== 200) {
      setError(data.error || "Ошибка перевода");
      setSending(false);
      return;
    }

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

  const emojiCards = cards.filter((c) => !!c.emojiCode);
  const basicCards = cards.filter((c) => !c.emojiCode);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Переводы</h1>
          <p className="text-muted-foreground text-sm mt-1">Мгновенные переводы по секретному emoji-коду</p>
        </div>
        <CreateCardDialog onCreated={() => fetch("/api/cards").then(r => r.json()).then(setCards)} existingCards={cards.map(c => ({ id: c.id, tier: c.tier, balance: c.balance, label: `${tierMeta[c.tier].label} ••${c.number.slice(-4)}` }))} />
      </div>

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

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader><CardTitle className="text-white">Отправить перевод</CardTitle><CardDescription>Введите 4-эмодзи код получателя</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-zinc-400">Emoji-код (Ровно 4 символа)</Label>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl shadow-inner">
                  {emojiArray[idx] || ""}
                </div>
              ))}
              {emojiArray.length > 0 && (
                 <Button variant="ghost" size="icon" onClick={() => setEmojiCode("")} className="h-14 w-14 rounded-xl border border-zinc-900 hover:bg-zinc-900">
                   <Trash2 className="w-5 h-5 text-zinc-500" />
                 </Button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap max-w-md pt-2">
              {["🦒","🐼","🐦","🦁","🦊","🐻","🐯","🐹","🐰","🐨"].map((e) => (
                <button
                  key={e}
                  disabled={emojiArray.length >= 4}
                  onClick={() => setEmojiCode((prev) => prev + e)}
                  className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg flex items-center justify-center"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Сумма</Label>
            <div className="relative">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="bg-zinc-900 border-zinc-800 text-white text-2xl font-bold pr-12 h-14 focus:ring-blue-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg font-mono">MR</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <Separator className="bg-zinc-900" />

          <Button
            variant="gradient"
            className="w-full h-14 text-lg font-bold transition-all disabled:opacity-50 shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
            onClick={handleSend}
            disabled={sending || !amount || !isValid}
          >
            {sending ? "Транзакция..." : `Перевести ${amount || 0} MR`} <ArrowUpRight className="ml-2 w-5 h-5" />
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader><CardTitle className="text-white">Мои реквизиты</CardTitle><CardDescription>Коды ваших активных карт</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {emojiCards.map((card) => (
            <div key={card.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-900 bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-2xl shadow-xl">{card.emojiCode}</div>
                <div>
                  <p className="text-sm font-bold text-zinc-200">{card.holder}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest">{tierMeta[card.tier].label} ••{card.number.slice(-4)}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="bg-zinc-950 border-zinc-800 hover:bg-zinc-900 text-zinc-300" onClick={() => card.emojiCode && copyCode(card.emojiCode, card.id)}>
                {copiedId === card.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === card.id ? "Ок" : "Копи"}
              </Button>
            </div>
          ))}
          {basicCards.length > 0 && (
            <div className="space-y-2">
              {basicCards.map((card) => (
                <div key={card.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 opacity-40">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center"><Lock className="w-5 h-5 text-zinc-700" /></div>
                    <div>
                      <p className="text-sm font-bold text-zinc-500">{card.holder}</p>
                      <p className="text-xs text-zinc-600 uppercase tracking-widest">{tierMeta[card.tier].label} ••{card.number.slice(-4)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-zinc-800">Gold+</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
export default withAccess(TransfersPage, "/dashboard/transfers");
