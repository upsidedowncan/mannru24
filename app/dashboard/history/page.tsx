"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { Transaction } from "@/lib/db";

import { withAccess } from "@/components/AccessGuard";

function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions").then((r) => r.json()).then((data) => { setTransactions(data); setLoading(false); });
  }, []);

  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpense = Math.abs(transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));

  if (loading) {
    return <div className="space-y-6"><div className="h-8 w-32 bg-secondary rounded animate-pulse" /><div className="grid grid-cols-2 gap-4"><div className="h-20 bg-secondary rounded-xl animate-pulse" /><div className="h-20 bg-secondary rounded-xl animate-pulse" /></div></div>;
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">История</h1><p className="text-muted-foreground text-sm mt-1">Все ваши транзакции</p></div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Доходы за месяц</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-500">+{totalIncome.toLocaleString("ru")} МР</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Расходы за месяц</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-500">-{totalExpense.toLocaleString("ru")} МР</div></CardContent></Card>
      </div>

      {transactions.length === 0 ? (
        <Card><CardContent className="pt-6 text-center py-12 text-muted-foreground">Нет транзакций</CardContent></Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList><TabsTrigger value="all">Все</TabsTrigger><TabsTrigger value="income">Доходы</TabsTrigger><TabsTrigger value="expense">Расходы</TabsTrigger></TabsList>
          {["all", "income", "expense"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              <Card><CardContent className="pt-6">
                <div className="space-y-1">
                  {(tab === "all" ? transactions : tab === "income" ? transactions.filter((t) => t.amount > 0) : transactions.filter((t) => t.amount < 0)).map((tx, i, arr) => (
                    <div key={tx.id}>
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.amount > 0 ? "bg-emerald-500/10" : "bg-secondary"}`}>
                            {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" /> : <ArrowUpRight className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <div><p className="text-sm font-medium">{tx.name}</p><p className="text-xs text-muted-foreground">{tx.category}</p></div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${tx.amount > 0 ? "text-emerald-500" : ""}`}>{tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("ru")} МР</p>
                          <p className="text-xs text-muted-foreground">{tx.date}</p>
                        </div>
                      </div>
                      {i < arr.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
export default withAccess(HistoryPage, "/dashboard/history");
