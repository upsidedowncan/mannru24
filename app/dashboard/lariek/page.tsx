"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RiHeartLine, RiStore2Line, RiHandHeartLine, RiRefreshLine, RiArrowLeftSLine } from "react-icons/ri";
import { CardSelect } from "@/components/CardSelect";
import Link from "next/link";

export default function LariekPage() {
  const [charityBalance, setCharityBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [donateAmount, setDonateAmount] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/lariek/balance");
      const data = await res.json();
      setCharityBalance(data.balance);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBalance(); }, []);

  const handleDonate = async () => {
    if (!selectedCardId || !donateAmount) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/lariek/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(donateAmount), cardId: selectedCardId }),
      });
      if (res.ok) {
        toast.success("Спасибо за пожертвование!");
        setDonateAmount("");
        fetchBalance();
      } else {
        const data = await res.json();
        toast.error(data.error || "Ошибка");
      }
    } catch {
      toast.error("Сетевая ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedCardId) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/lariek/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: selectedCardId }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Вы получили ${data.amount} МР!`);
        fetchBalance();
      } else {
        const data = await res.json();
        toast.error(data.error || "Ошибка");
      }
    } catch {
      toast.error("Сетевая ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-secondary rounded animate-pulse" />
        <div className="h-[400px] bg-secondary rounded-xl animate-pulse" />
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 md:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ларёк</h1>
          <p className="text-muted-foreground text-sm mt-1">Благотворительный фонд системы</p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <RiArrowLeftSLine className="w-4 h-4" /> Назад
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-500">
              <RiHeartLine className="w-5 h-5" /> Общий фонд
            </CardTitle>
            <CardDescription>Деньги, собранные сообществом</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-emerald-500">{charityBalance.toLocaleString("ru")} МР</div>
            <p className="text-xs text-emerald-500/60 mt-2 uppercase tracking-widest font-bold">Собрано на помощь</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiStore2Line className="w-5 h-5 text-primary" /> Управление
            </CardTitle>
            <CardDescription>Пожертвовать или попросить помощи</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Выберите вашу карту</Label>
              <CardSelect value={selectedCardId} onValueChange={setSelectedCardId} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Сумма"
                  value={donateAmount}
                  onChange={e => setDonateAmount(e.target.value)}
                />
                <Button
                  className="w-full h-11"
                  variant="gradient"
                  onClick={handleDonate}
                  disabled={actionLoading || !selectedCardId || !donateAmount}
                >
                  {actionLoading ? <RiRefreshLine className="animate-spin" /> : <RiHandHeartLine className="mr-2" />}
                  ПОЖЕРТВОВАТЬ
                </Button>
              </div>
              <div className="flex flex-col justify-end">
                <Button
                  className="w-full h-11"
                  variant="secondary"
                  onClick={handleWithdraw}
                  disabled={actionLoading || !selectedCardId}
                >
                  {actionLoading ? <RiRefreshLine className="animate-spin" /> : "НУЖНА ПОМОЩЬ"}
                </Button>
                <p className="text-[9px] text-muted-foreground mt-2 text-center">Раз в день для балансов &lt; 1000 МР</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
