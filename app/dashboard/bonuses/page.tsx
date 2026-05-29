"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiCheckboxCircleFill, RiStarFill, RiExchangeLine, RiInformationLine, RiFlashlightLine, RiTimeLine } from "react-icons/ri";
import { toast } from "sonner";
import { useProgression } from "@/lib/progression";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { tierMeta } from "@/components/BankCard";
import type { UserProfile, Bonus } from "@/lib/db";
import { withAccess } from "@/components/AccessGuard";

function BonusesPage() {
  const { refresh: refreshProgression } = useProgression();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [userRes, cardsRes, bonusesRes] = await Promise.all([
        fetch("/api/user"),
        fetch("/api/cards"),
        fetch("/api/bonuses")
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (cardsRes.ok) {
        const data = await cardsRes.json();
        if (Array.isArray(data)) {
          setCards(data);
          if (data.length > 0 && !selectedCardId) setSelectedCardId(data[0].id);
        }
      }
      if (bonusesRes.ok) setBonuses(await bonusesRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRedeem = async () => {
    if (!selectedCardId || (user?.bonusBalance || 0) < 10) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/bonuses/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: selectedCardId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Бонусы обменяны! +${data.mrAmount} МР на карту`);
        fetchData();
        refreshProgression();
      } else {
        toast.error(data.error || "Ошибка обмена");
      }
    } catch (err) {
      toast.error("Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const activateBonus = async (id: string) => {
    const bonus = bonuses.find(b => b.id === id);
    if (!bonus || (user?.bonusBalance || 0) < bonus.points) {
      toast.error("Недостаточно баллов");
      return;
    }

    try {
      const res = await fetch("/api/bonuses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, activated: true }),
      });
      if (res.ok) {
        toast.success("Бонус активирован!");
        fetchData();
        refreshProgression();
      }
    } catch (err) {
      toast.error("Ошибка активации");
    }
  };

  if (loading) return <div className="space-y-6"><div className="h-8 w-48 bg-secondary rounded animate-pulse" /><div className="h-[400px] bg-secondary rounded-xl animate-pulse" /></div>;
  if (!user) return null;

  const redeemableAmount = Math.floor(user.bonusBalance / 10);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Бонусы и Кэшбэк</h1>
        <p className="text-muted-foreground text-sm mt-1">Управляйте вашими накоплениями и активируйте предложения</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary/5 border-primary/20 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RiStarFill className="w-5 h-5 text-amber-500" /> Бонусный баланс
            </CardTitle>
            <CardDescription>Копите баллы за операции и задания</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-primary">{user.bonusBalance.toLocaleString("ru")}</div>
            <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest font-bold">Баллов лояльности</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RiExchangeLine className="w-5 h-5 text-blue-500" /> Обмен на МР
            </CardTitle>
            <CardDescription>Курс обмена: 10 баллов = 1 МР</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Карта для зачисления</Label>
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите карту" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {tierMeta[c.tier as keyof typeof tierMeta]?.label} ••{c.number.slice(-4)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full h-11 font-bold"
              variant="gradient"
              disabled={actionLoading || user.bonusBalance < 10}
              onClick={handleRedeem}
            >
              {user.bonusBalance < 10 ? "Недостаточно баллов" : `ОБМЕНЯТЬ НА ${redeemableAmount} МР`}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Доступные бонусы</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bonuses.map((bonus) => (
            <Card key={bonus.id} className={bonus.activated ? "opacity-60 grayscale bg-secondary/20" : "hover:border-primary/30 transition-colors"}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={bonus.activated ? "secondary" : "outline"} className="text-[10px] uppercase font-bold">
                    {bonus.category}
                  </Badge>
                  {!bonus.activated && (
                    <div className="flex items-center gap-1 text-primary font-bold text-sm">
                      <RiStarFill className="w-3.5 h-3.5 text-amber-500" />
                      {bonus.points}
                    </div>
                  )}
                </div>
                <CardTitle className="text-base line-clamp-1">{bonus.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 h-8">{bonus.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {bonus.activated ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-500 text-xs font-bold py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                    <RiCheckboxCircleFill className="w-4 h-4" /> АКТИВИРОВАНО
                  </div>
                ) : (
                  <Button
                    className="w-full h-9 text-xs font-bold"
                    variant="secondary"
                    onClick={() => activateBonus(bonus.id)}
                    disabled={(user.bonusBalance || 0) < bonus.points}
                  >
                    АКТИВИРОВАТЬ
                  </Button>
                )}
                <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-medium">
                  <RiTimeLine className="w-3 h-3" /> Истекает через: {bonus.expires}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <RiInformationLine className="w-5 h-5 text-blue-500 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-400">Как работают бонусы?</p>
              <p className="text-xs text-blue-500/70 leading-relaxed">
                Вы получаете бонусные баллы за каждую покупку по карте (кэшбэк) и за выполнение ежедневных заданий.
                Баллы можно мгновенно обменять на валюту МР и зачислить на любую из ваших карт.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAccess(BonusesPage, "/dashboard/bonuses");
