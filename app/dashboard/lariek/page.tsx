"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  RiHeartLine,
  RiStore2Line,
  RiHandHeartLine,
  RiRefreshLine,
  RiArrowLeftSLine,
  RiHeartHandLine,
  RiCoinLine,
} from "react-icons/ri";
import { CardSelect } from "@/components/CardSelect";
import Link from "next/link";

export default function LariekPage() {
  const router = useRouter();
  const [charityBalance, setCharityBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [donateAmount, setDonateAmount] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/lariek/balance");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setCharityBalance(data.balance ?? 0);
    } catch (e) {
      console.error(e);
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleDonate = async () => {
    if (!selectedCardId || !donateAmount) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/lariek/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(donateAmount),
          cardId: selectedCardId,
        }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        toast.success("Спасибо за пожертвование!");
        setDonateAmount("");
        fetchBalance();
      } else {
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
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        toast.success(`Вы получили ${data.amount} МР!`);
        fetchBalance();
      } else {
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
        <div className="flex gap-4">
          <div className="w-full h-[180px] bg-secondary rounded-xl animate-pulse" />
          <div className="w-full h-[180px] bg-secondary rounded-xl animate-pulse" />
        </div>
        <div className="h-[320px] bg-secondary rounded-xl animate-pulse" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header — same pattern as dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ларёк</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Благотворительный фонд системы
          </p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <RiArrowLeftSLine className="w-4 h-4" /> Назад
        </Link>
      </div>

      {/* Stats row — mirrors dashboard stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Общий фонд
            </CardTitle>
            <RiHeartLine className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {charityBalance.toLocaleString("ru")} МР
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Собрано сообществом
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Выплата помощи
            </CardTitle>
            <RiCoinLine className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">50 МР</div>
            <p className="text-xs text-muted-foreground mt-1">
              Для балансов &lt; 1 000 МР
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RiStore2Line className="w-5 h-5 text-primary" /> Управление
          </CardTitle>
          <CardDescription>
            Пожертвовать или попросить помощи
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Выберите вашу карту</Label>
            <CardSelect
              value={selectedCardId}
              onValueChange={setSelectedCardId}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Donate */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">
                  Сумма пожертвования
                </Label>
                <Input
                  type="number"
                  placeholder="Введите сумму"
                  value={donateAmount}
                  min={1}
                  onChange={(e) => setDonateAmount(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                variant="gradient"
                onClick={handleDonate}
                disabled={actionLoading || !selectedCardId || !donateAmount}
              >
                {actionLoading ? (
                  <RiRefreshLine className="animate-spin mr-2" />
                ) : (
                  <RiHandHeartLine className="mr-2" />
                )}
                Пожертвовать
              </Button>
            </div>

            {/* Withdraw */}
            <div className="flex flex-col justify-end space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Нужна помощь?</p>
                <p className="text-xs text-muted-foreground">
                  Получите 50 МР из фонда, если ваш баланс ниже 1 000 МР
                </p>
              </div>
              <Button
                className="w-full"
                variant="secondary"
                onClick={handleWithdraw}
                disabled={actionLoading || !selectedCardId}
              >
                {actionLoading ? (
                  <RiRefreshLine className="animate-spin mr-2" />
                ) : (
                  <RiHeartHandLine className="mr-2" />
                )}
                Попросить помощи
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
