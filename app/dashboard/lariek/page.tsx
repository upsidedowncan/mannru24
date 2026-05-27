"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UpdateIcon, ChevronLeftIcon, HeartIcon, CrumpledPaperIcon, ArchiveIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export default function LariekPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [amount, setAmount] = useState(100);
  const [poolBalance, setPoolBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/charity");
      const data = await res.json();
      setPoolBalance(data.balance);
    } catch (e) {}
  };

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
    fetchStats();
  }, []);

  const handleDeposit = async () => {
    if (!selectedCardId || amount <= 0) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/charity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deposit", amount, cardId: selectedCardId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Спасибо за ваше пожертвование");
        setPoolBalance(data.poolBalance);
        setCards(prev => prev.map(c => c.id === selectedCardId ? { ...c, balance: data.newBalance } : c));
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Сетевая ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/charity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Средства зачислены на вашу карту");
        setPoolBalance(data.poolBalance);
        setCards(prev => prev.map((c, i) => i === 0 ? { ...c, balance: data.newBalance } : c));
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Сетевая ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="space-y-6"><div className="h-8 w-32 bg-secondary rounded animate-pulse" /><div className="h-40 bg-secondary rounded-xl animate-pulse" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ларёк</h1>
        <p className="text-muted-foreground text-sm mt-1">Социальная помощь участникам Системы</p>
      </div>

      <Card className="bg-emerald-500/5 border-emerald-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-emerald-500 uppercase tracking-wider">Доступно в пуле</p>
              <p className="text-3xl font-bold">{poolBalance.toLocaleString()} МР</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ArchiveIcon className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HeartIcon className="w-5 h-5 text-red-500" /> Стать спонсором
            </CardTitle>
            <CardDescription className="text-xs text-balance">Помогите нуждающимся участникам Системы</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">Карта</label>
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Выберите карту" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.tier} • {c.balance} МР</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">Сумма</label>
              <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="bg-secondary/50" />
            </div>
            <Button onClick={handleDeposit} disabled={actionLoading} className="w-full" variant="gradient">
              {actionLoading ? <UpdateIcon className="animate-spin" /> : "Пожертвовать"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CrumpledPaperIcon className="w-5 h-5 text-zinc-500" /> Забрать пособие
            </CardTitle>
            <CardDescription className="text-xs">Для участников с балансом ниже 200 МР</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg text-center">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Разовая выплата</p>
              <p className="text-2xl font-bold">50 МР</p>
            </div>
            <div className="h-[76px]" /> {/* Spacer to align with left card */}
            <Button
              onClick={handleWithdraw}
              disabled={actionLoading || poolBalance < 50}
              variant="outline"
              className="w-full"
            >
              {actionLoading ? <UpdateIcon className="animate-spin" /> : "Запросить помощь"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
