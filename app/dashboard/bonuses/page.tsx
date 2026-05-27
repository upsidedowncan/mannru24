"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArchiveIcon,
  LightningBoltIcon,
  StarFilledIcon,
  MagicWandIcon,
  ClockIcon,
  ArrowRightIcon,
  CheckCircledIcon,
  PieChartIcon,
  SymbolIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import { withAccess } from "@/components/AccessGuard";
import { tierMeta } from "@/components/BankCard";
import type { Bonus, UserProfile, Card as CardType } from "@/lib/db";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const iconMap: Record<string, any> = {
  "Кэшбэк": PieChartIcon,
  "Акции": SymbolIcon,
  "Подарки": ArchiveIcon,
  "Специальные": MagicWandIcon,
};

function BonusesPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("all");
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bonusesRes, userRes, cardsRes] = await Promise.all([
        fetch("/api/bonuses"),
        fetch("/api/user"),
        fetch("/api/cards")
      ]);

      if (bonusesRes.status === 401 || userRes.status === 401) {
        router.push("/login");
        return;
      }

      const bonusesData = await bonusesRes.json();
      const userData = await userRes.json();
      const cardsData = await cardsRes.json();

      setBonuses(Array.isArray(bonusesData) ? bonusesData : []);
      setCards(Array.isArray(cardsData) ? cardsData : []);
      setUser(userData && !userData.error ? userData : null);

      if (Array.isArray(cardsData) && cardsData.length > 0 && !selectedCardId) {
        setSelectedCardId(cardsData[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const activateBonus = async (id: string) => {
    await fetch("/api/bonuses", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, activated: true }) });
    fetchData();
  };

  const redeemBonuses = async () => {
    if (!user || user.bonusBalance < 100 || !selectedCardId) return;
    setRedeeming(true);
    try {
      const res = await fetch("/api/bonuses/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: user.bonusBalance, cardId: selectedCardId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Бонусы обменяны!`, {
          description: `Вы получили ${data.mrReceived} MR на карту.`,
        });
        fetchData();
      } else {
        toast.error(data.error || "Ошибка обмена");
      }
    } catch (e) {
      toast.error("Ошибка сети");
    } finally {
      setRedeeming(false);
    }
  };

  const activatedCount = bonuses.filter((b) => b.activated).length;
  const categories = ["all", ...Array.from(new Set(bonuses.map((b) => b.category)))];

  if (loading) return <div className="space-y-6"><div className="h-8 w-32 bg-secondary rounded animate-pulse" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map((i) => <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />)}</div></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Бонусы</h1><p className="text-muted-foreground text-sm mt-1">Баланс: <span className="font-medium text-foreground">{user?.bonusBalance.toLocaleString("ru") || 0} баллов</span></p></div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-2 bg-gradient-to-br from-blue-600/20 to-zinc-900 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-400">Обмен баллов</CardTitle>
            <CardDescription className="text-xs">10 баллов = 1 MR</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-[10px] uppercase text-zinc-500">Куда зачислить</Label>
                <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800">
                    <SelectValue placeholder="Выберите карту" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    {cards.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {tierMeta[c.tier].label} ••{c.number.slice(-4)} ({c.balance.toLocaleString()} MR)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                disabled={redeeming || !user || user.bonusBalance < 100 || cards.length === 0}
                onClick={redeemBonuses}
                variant="gradient"
                className="h-10 px-6"
              >
                {redeeming ? <UpdateIcon className="w-4 h-4 animate-spin" /> : "Обменять всё"}
              </Button>
            </div>
            {user && user.bonusBalance < 100 && (
              <p className="text-[10px] text-zinc-500 italic">Минимальная сумма для обмена — 100 баллов. Качайтесь дальше.</p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-zinc-950 border-zinc-900"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Активировано</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-500">{activatedCount}</div></CardContent></Card>
        <Card className="bg-zinc-950 border-zinc-900"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Серия дней</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-500">{user?.streak || 0} <LightningBoltIcon className="inline w-5 h-5 text-amber-500" /></div></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>{cat === "all" ? "Все" : cat}</TabsTrigger>
          ))}
        </TabsList>
        {categories.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {(tab === "all" ? bonuses : bonuses.filter((b) => b.category === tab)).length === 0 ? (
              <Card><CardContent className="pt-6 text-center py-12 text-muted-foreground">Нет доступных бонусов</CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(tab === "all" ? bonuses : bonuses.filter((b) => b.category === tab)).map((bonus) => {
                  const Icon = iconMap[bonus.category] || ArchiveIcon;
                  return (
                    <Card key={bonus.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><Icon className="w-5 h-5" /></div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground"><ClockIcon className="w-3 h-3" />{bonus.expires}</div>
                        </div>
                        <div className="mt-3">
                          <Badge variant="secondary" className="mb-2">{bonus.category}</Badge>
                          <CardTitle className="text-base">{bonus.title}</CardTitle>
                          <CardDescription className="mt-1">{bonus.description}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardFooter className="mt-auto flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-1 text-sm font-medium"><StarFilledIcon className="w-3.5 h-3.5 text-amber-500" />{bonus.points} баллов</div>
                        {bonus.activated ? (
                          <Badge variant="success" className="gap-1"><CheckCircledIcon className="w-3 h-3" /> Активирован</Badge>
                        ) : (
                          <Button size="sm" variant="gradient" className="gap-1.5" onClick={() => activateBonus(bonus.id)}>Активировать <ArrowRightIcon className="w-3 h-3" /></Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
export default withAccess(BonusesPage, "/dashboard/bonuses");
