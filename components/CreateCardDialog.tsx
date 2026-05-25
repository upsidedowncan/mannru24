"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CreditCard, ArrowUpRight, Lock } from "lucide-react";
import type { CardTier } from "@/lib/db";
import { tierUnlockLevel } from "@/lib/constants";
import { tierMeta } from "@/components/BankCard";
import { useProgression } from "@/lib/progression";

interface CreateCardDialogProps {
  onCreated: () => void;
  existingCards: { id: string; tier: CardTier; balance: number; label: string }[];
  disabled?: boolean;
}

const tierOrder: CardTier[] = ["bronze", "silver", "gold", "platinum", "titanium", "ruby", "emerald", "sapphire", "diamond", "black", "obsidian"];

const upgradeCosts: Record<CardTier, number> = {
  bronze: 0,
  silver: 0,
  gold: 500,
  platinum: 1000,
  titanium: 2000,
  ruby: 3500,
  emerald: 5000,
  sapphire: 8000,
  diamond: 12000,
  black: 20000,
  obsidian: 50000,
};

export function CreateCardDialog({ onCreated, existingCards, disabled }: CreateCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"tier" | "details" | "fund">("tier");
  const [tier, setTier] = useState<CardTier>("bronze");
  const [holder, setHolder] = useState("");
  const [sourceCard, setSourceCard] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardCount, setCardCount] = useState(0);
  const { level, triggerLevelUps } = useProgression();

  useEffect(() => {
    fetch("/api/cards").then((r) => r.json()).then((cards: any[]) => setCardCount(cards.length));
  }, [open]);

  useEffect(() => {
    if (isTierLocked(tier)) {
      const firstUnlocked = tierOrder.find((t) => !isTierLocked(t)) || "bronze";
      setTier(firstUnlocked);
    }
  }, [level, tier]);

  const isFirstCard = cardCount === 0;
  const selectedTier = tierMeta[tier];
  const cost = upgradeCosts[tier];
  const needsFunding = !isFirstCard && cost > 0;

  const availableSources = existingCards.filter((c) => c.balance >= cost);

  const isTierLocked = (t: CardTier) => tierUnlockLevel[t] > level;

  const handleNext = () => {
    if (step === "tier") {
      if (needsFunding && availableSources.length === 0) return;
      setStep(needsFunding ? "fund" : "details");
    } else if (step === "fund") {
      setStep("details");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const initialBalance = isFirstCard ? 1000 : 0;
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          holder: holder.toUpperCase() || "CARD HOLDER",
          balance: initialBalance,
          sourceCardId: sourceCard || undefined,
          upgradeCost: cost,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.levelUps?.length) {
          triggerLevelUps(data.levelUps, data.level, data.xp, data.currentXp, data.nextXp);
        }
        setOpen(false);
        setHolder("");
        setSourceCard("");
        setTier("bronze");
        setStep("tier");
        onCreated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) { setOpen(true); setStep("tier"); } else setOpen(false); }}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="sm" className="gap-1.5" disabled={disabled}>
          <Plus className="w-4 h-4" />
          Новая карта
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isFirstCard ? "Первая карта" : "Создать карту"}</DialogTitle>
          <DialogDescription>
            {isFirstCard ? "Вам будет начислено 1 000 МР на первую карту" : "Выберите тариф и создайте карту"}
          </DialogDescription>
        </DialogHeader>

        {step === "tier" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Тариф</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as CardTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tierOrder.map((t) => {
                    const meta = tierMeta[t];
                    const locked = isTierLocked(t);
                    return (
                      <SelectItem key={t} value={t} disabled={locked}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-sm ${meta.gradient} ring-1 ring-white/10`} />
                          <span>{meta.label}</span>
                          <span className="text-muted-foreground text-xs ml-auto">{meta.cashback}</span>
                          {locked && <Lock className="w-3 h-3 ml-1 text-muted-foreground/50" />}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className={`p-4 rounded-lg ${selectedTier.gradient} ring-1 ${selectedTier.ring}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${selectedTier.subtext}`}>Кэшбэк</p>
                  <p className={`text-xl font-bold ${selectedTier.textColor}`}>{selectedTier.cashback}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs ${selectedTier.subtext}`}>Стоимость</p>
                  <p className={`text-sm font-semibold ${selectedTier.textColor}`}>{selectedTier.price}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                <p className={`text-xs ${selectedTier.subtext}`}>Требуемый уровень</p>
                <p className={`text-sm font-semibold ${selectedTier.textColor}`}>{tierUnlockLevel[tier]}</p>
              </div>
            </div>

            {needsFunding && cost > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                <p className="text-amber-400 font-medium">Для создания карты этого тарифа нужно {cost.toLocaleString("ru")} МР</p>
                <p className="text-muted-foreground text-xs mt-1">Сумма будет списана с другой вашей карты</p>
              </div>
            )}

            {needsFunding && availableSources.length === 0 && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
                <p className="text-red-400 font-medium">Недостаточно средств на других картах</p>
              </div>
            )}

            <Button variant="gradient" className="w-full gap-2" onClick={handleNext} disabled={needsFunding && availableSources.length === 0}>
              Далее <ArrowUpRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === "fund" && needsFunding && (
          <div className="space-y-4">
            <Label>Выберите карту для списания ({cost.toLocaleString("ru")} МР)</Label>
            <div className="space-y-2">
              {existingCards.filter((c) => c.balance >= cost).map((card) => (
                <button
                  key={card.id}
                  onClick={() => setSourceCard(card.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    sourceCard === card.id ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm ${tierMeta[card.tier].gradient}`} />
                      <span className="text-sm font-medium">{card.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{card.balance.toLocaleString("ru")} МР</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("tier")}>Назад</Button>
              <Button variant="gradient" className="flex-1" onClick={() => setStep("details")} disabled={!sourceCard}>Далее</Button>
            </div>
          </div>
        )}

        {step === "details" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="holder">Держатель карты</Label>
              <Input id="holder" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="IVAN IVANOV" />
            </div>

            {isFirstCard && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
                <p className="text-emerald-400 font-medium">Бонус: +1 000 МР на первую карту</p>
              </div>
            )}

            {needsFunding && sourceCard && (
              <div className="p-3 rounded-lg bg-secondary text-sm">
                <p className="text-muted-foreground">Списание {cost.toLocaleString("ru")} МР с карты {existingCards.find((c) => c.id === sourceCard)?.label}</p>
              </div>
            )}

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button type="submit" variant="gradient" className="gap-2" disabled={loading}>
                <CreditCard className="w-4 h-4" />
                {loading ? "Создание..." : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
