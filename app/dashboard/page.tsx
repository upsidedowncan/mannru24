"use client";

import { useEffect, useState } from "react";
import { BankCard } from "@/components/BankCard";
import { CreateCardDialog } from "@/components/CreateCardDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ArrowUpRight, ArrowDownLeft, Percent, TrendingUp, Wallet, Send, QrCode, Plus, ChevronRight, CreditCard, Lock, AlertCircle, Gift } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Card as CardType, Transaction, UserProfile } from "@/lib/db";

export default function DashboardPage() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cardsRes, txRes, userRes] = await Promise.all([
        fetch("/api/cards"),
        fetch("/api/transactions?limit=5"),
        fetch("/api/user"),
      ]);

      if (cardsRes.status === 401 || txRes.status === 401 || userRes.status === 401) {
        router.push("/login");
        return;
      }

      const cardsData = await cardsRes.json();
      const txData = await txRes.json();
      const userData = await userRes.json();

      setCards(Array.isArray(cardsData) ? cardsData : []);
      setTransactions(Array.isArray(txData) ? txData : []);
      setUser(userData && !userData.error ? userData : null);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const [dailyClaiming, setDailyClaiming] = useState(false);
  const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);

  const claimDaily = async () => {
    if (dailyClaiming || cards.length === 0) return;
    setDailyClaiming(true);
    try {
      // Satirical daily reward: random small amount
      const amount = Math.floor(Math.random() * 50) + 10;
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Ежедневная подачка",
          category: "Бонусы",
          amount,
          cardId: cards[0].id
        }),
      });
      if (res.ok) {
        toast.success(`Вы получили ${amount} MR!`, {
          description: "Не потратьте всё сразу (хотя нам всё равно).",
        });
        fetchData();
      }
    } finally {
      setDailyClaiming(false);
    }
  };
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpense = Math.abs(transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));

  const stats = [
    { label: "Баланс", value: `${totalBalance.toLocaleString("ru")} МР`, sub: `${cards.length} карт`, icon: Wallet },
    { label: "Доходы", value: `+${totalIncome.toLocaleString("ru")} МР`, sub: "В этом месяце", icon: ArrowDownLeft },
    { label: "Расходы", value: `${totalExpense.toLocaleString("ru")} МР`, sub: "В этом месяце", icon: ArrowUpRight },
    { label: "Бонусы", value: user ? `${user.bonusBalance.toLocaleString("ru")}` : "0", sub: user ? `Уровень ${user.level}` : "", icon: Percent },
  ];

  const quickActions = [
    { label: "Перевод", icon: Send, level: 5, href: "/dashboard/transfers" },
    { label: "Оплата", icon: QrCode, level: 1, href: "/dashboard" },
    { label: "Пополнить", icon: Plus, level: 1, href: "/dashboard" },
    { label: "Инвестиции", icon: TrendingUp, level: 15, href: "/dashboard/investments" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-secondary rounded animate-pulse" />
        <div className="flex gap-4"><div className="w-[300px] h-[189px] bg-secondary rounded-xl animate-pulse" /></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map((i) => <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Главная</h1>
            <p className="text-muted-foreground text-sm mt-1">Добро пожаловать, {user?.name || "пользователь"}</p>
          </div>
          <CreateCardDialog onCreated={fetchData} existingCards={cards.map((c) => ({ id: c.id, tier: c.tier, balance: c.balance, label: `${c.tier} ••${c.number.slice(-4)}` }))} />
        </div>

        {cards.length > 0 ? (
          <ScrollArea className="w-full pb-2">
            <div className="flex gap-4 w-max">
              {cards.map((card) => (
                <BankCard key={card.id} tier={card.tier} number={card.number} holder={card.holder} balance={card.balance} expiry={card.expiry} emojiCode={card.emojiCode} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4"><CreditCard className="w-8 h-8 text-muted-foreground" /></div>
              <h3 className="text-lg font-medium mb-1">У вас пока нет карт</h3>
              <p className="text-muted-foreground text-sm mb-4">Создайте свою первую карту и получите 1 000 МР</p>
              <CreateCardDialog onCreated={fetchData} existingCards={[]} />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:border-blue-500/50 transition-colors group relative overflow-hidden"
            onClick={claimDaily}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-400">Ежедневная награда</CardTitle>
              <Gift className={`w-4 h-4 text-blue-500 ${dailyClaiming ? "animate-bounce" : ""}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">Получить</div>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tighter">Нажми, если не гордый</p>
            </CardContent>
          </Card>
          {stats.slice(0, 3).map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const isLocked = (user?.level || 1) < action.level;
            const content = (
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLocked ? "bg-zinc-900" : "bg-zinc-800"}`}>
                  <action.icon className={`w-5 h-5 ${isLocked ? "text-zinc-600" : "text-zinc-100"}`} />
                </div>
                {isLocked && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                    <Lock className="w-2 h-2 text-zinc-500" />
                  </div>
                )}
              </div>
            );

            return (
              <Tooltip key={action.label}>
                <TooltipTrigger asChild>
                  {isLocked ? (
                    <button
                      onClick={() => toast.error(`Куда лезешь?`, {
                        description: `Эта функция доступна только для элиты ${action.level} уровня. Качайся.`,
                        icon: <AlertCircle className="w-4 h-4 text-red-500" />
                      })}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border transition-all bg-zinc-950/50 border-zinc-900 opacity-50 cursor-pointer"
                    >
                      {content}
                      <span className="text-sm font-medium text-zinc-500">{action.label}</span>
                    </button>
                  ) : (
                    <Link
                      href={action.href}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border transition-all bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
                    >
                      {content}
                      <span className="text-sm font-medium text-zinc-200">{action.label}</span>
                    </Link>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isLocked ? `Доступно с ${action.level} уровня` : action.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {transactions.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Последние операции</CardTitle><CardDescription>Ваши последние транзакции</CardDescription></div>
              <Button variant="ghost" size="sm" className="gap-1">Все <ChevronRight className="w-3.5 h-3.5" /></Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((tx, i) => (
                  <div key={tx.id}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{tx.name}</p>
                        <p className="text-xs text-muted-foreground">{tx.category}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${tx.amount > 0 ? "text-emerald-500" : ""}`}>{tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("ru")} МР</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    {i < transactions.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
