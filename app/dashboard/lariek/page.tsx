"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UpdateIcon, HeartIcon, CrumpledPaperIcon, ArchiveIcon } from "@radix-ui/react-icons";
import { CardSelect } from "@/components/CardSelect";

export default function LariekPage() {
  const [selectedCardId, setSelectedCardId] = useState("");
  const [amount, setAmount] = useState(100);
  const [poolBalance, setPoolBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

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
          if (data.length > 0 && !selectedCardId) setSelectedCardId(data[0].id);
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
        setBalance(data.newBalance);
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
        setBalance(data.newBalance);
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Сетевая ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="space-y-6 px-4 md:px-0"><div className="h-8 w-32 bg-secondary rounded animate-pulse" /><div className="h-40 bg-secondary rounded-xl animate-pulse" /></div>;

  return (
    <div className="space-y-6 px-4 md:px-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ларёк</h1>
        <p className="text-muted-foreground text-sm mt-1">Социальная помощь участникам Системы</p>
      </div>

      <Card className="bg-emerald-500/5 border-emerald-500/10 overflow-hidden relative shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        <CardContent className="pt-8 pb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Доступно в пуле</p>
              <p className="text-4xl font-black italic tracking-tighter">{poolBalance.toLocaleString("ru")} МР</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <ArchiveIcon className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-950 border-zinc-900 shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <HeartIcon className="w-4 h-4 text-red-500" /> Стать спонсором
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">Помогите нуждающимся участникам Системы</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-zinc-600 ml-1">Карта</label>
              <CardSelect value={selectedCardId} onValueChange={setSelectedCardId} className="bg-zinc-900/50 border-zinc-800" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-zinc-600 ml-1">Сумма</label>
              <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="bg-zinc-900/50 border-zinc-800" />
            </div>
            <Button onClick={handleDeposit} disabled={actionLoading} className="w-full h-11 text-xs font-bold" variant="gradient">
              {actionLoading ? <UpdateIcon className="animate-spin" /> : "ПОЖЕРТВОВАТЬ"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-900 shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <CrumpledPaperIcon className="w-4 h-4 text-zinc-400" /> Забрать пособие
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">Для участников с балансом ниже 1 000 МР</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-zinc-900/50 border border-zinc-900 border-dashed rounded-xl text-center">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Разовая выплата</p>
              <p className="text-3xl font-black italic tracking-tighter">100 МР</p>
            </div>
            <div className="h-[2px]" />
            <Button
              onClick={handleWithdraw}
              disabled={actionLoading || poolBalance < 100}
              variant="outline"
              className="w-full h-11 text-xs font-bold border-zinc-800 hover:bg-zinc-900"
            >
              {actionLoading ? <UpdateIcon className="animate-spin" /> : "ЗАПРОСИТЬ ПОМОЩЬ"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {balance !== null && (
        <div className="text-center">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Текущий баланс: <span className="text-zinc-400">{balance.toLocaleString("ru")} МР</span></p>
        </div>
      )}
    </div>
  );
}
