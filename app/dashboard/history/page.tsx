"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RiArrowLeftDownLine, RiArrowRightUpLine, RiHistoryLine } from "react-icons/ri";
import type { Transaction } from "@/lib/db";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { withAccess } from "@/components/AccessGuard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return [];
        }
        return res.json();
      })
      .then((data) => {
        setTransactions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch transactions:", error);
        toast.error("Ошибка загрузки истории");
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-secondary rounded animate-pulse" />
        <div className="h-[600px] bg-secondary rounded-xl animate-pulse" />
      </div>
    );
  }

  const filtered = transactions.filter(tx => {
      if (filter === "income") return tx.amount > 0;
      if (filter === "expense") return tx.amount < 0;
      return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">История операций</h1>
          <p className="text-muted-foreground text-sm mt-1">Все ваши транзакции в одном месте</p>
        </div>
        <Tabs value={filter} onValueChange={setFilter} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-3 md:w-[300px]">
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="income">Доходы</TabsTrigger>
            <TabsTrigger value="expense">Расходы</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RiHistoryLine className="w-5 h-5 text-primary" /> Последние действия
          </CardTitle>
          <CardDescription>Список всех денежных движений</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map((tx, i) => (
                <div key={tx.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.amount > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-400"}`}>
                        {tx.amount > 0 ? <RiArrowLeftDownLine className="w-5 h-5" /> : <RiArrowRightUpLine className="w-5 h-5" />}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{tx.name}</p>
                        <p className="text-xs text-muted-foreground">{tx.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.amount > 0 ? "text-emerald-500" : ""}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("ru")} МР
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">{tx.date}</p>
                    </div>
                  </div>
                  {i < filtered.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Операций не найдено</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default withAccess(HistoryPage, "/dashboard/history");
