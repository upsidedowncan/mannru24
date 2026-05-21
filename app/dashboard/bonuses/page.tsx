"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Flame, Star, Sparkles, Trophy, Clock, ArrowRight, CheckCircle2, Percent, Ticket, Zap } from "lucide-react";
import { withAccess } from "@/components/AccessGuard";
import type { Bonus, UserProfile } from "@/lib/db";

const iconMap: Record<string, typeof Gift> = {
  "Кэшбэк": Percent,
  "Акции": Ticket,
  "Подарки": Gift,
  "Специальные": Sparkles,
};

function BonusesPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    const [bonusesRes, userRes] = await Promise.all([fetch("/api/bonuses"), fetch("/api/user")]);
    setBonuses(await bonusesRes.json());
    setUser(await userRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const activateBonus = async (id: string) => {
    await fetch("/api/bonuses", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, activated: true }) });
    fetchData();
  };

  const activatedCount = bonuses.filter((b) => b.activated).length;
  const categories = ["all", ...Array.from(new Set(bonuses.map((b) => b.category)))];

  if (loading) return <div className="space-y-6"><div className="h-8 w-32 bg-secondary rounded animate-pulse" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map((i) => <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />)}</div></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Бонусы</h1><p className="text-muted-foreground text-sm mt-1">Баланс: <span className="font-medium text-foreground">{user?.bonusBalance.toLocaleString("ru") || 0} баллов</span></p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Доступно</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{bonuses.filter((b) => !b.activated).length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Активировано</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-500">{activatedCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Потрачено баллов</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{user?.bonusBalance ? Math.max(0, user.totalEarned - user.bonusBalance).toLocaleString("ru") : 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Серия дней</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-500">{user?.streak || 0} 🔥</div></CardContent></Card>
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
                  const Icon = iconMap[bonus.category] || Gift;
                  return (
                    <Card key={bonus.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><Icon className="w-5 h-5" /></div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{bonus.expires}</div>
                        </div>
                        <div className="mt-3">
                          <Badge variant="secondary" className="mb-2">{bonus.category}</Badge>
                          <CardTitle className="text-base">{bonus.title}</CardTitle>
                          <CardDescription className="mt-1">{bonus.description}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardFooter className="mt-auto flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-1 text-sm font-medium"><Star className="w-3.5 h-3.5 text-amber-500" />{bonus.points} баллов</div>
                        {bonus.activated ? (
                          <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Активирован</Badge>
                        ) : (
                          <Button size="sm" variant="gradient" className="gap-1.5" onClick={() => activateBonus(bonus.id)}>Активировать <ArrowRight className="w-3 h-3" /></Button>
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
