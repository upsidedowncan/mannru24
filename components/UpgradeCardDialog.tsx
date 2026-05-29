"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RiArrowRightUpLine, RiArrowUpSLine, RiIdCardLine } from "react-icons/ri";
import type { CardTier } from "@/lib/db";
import { tierMeta } from "@/components/BankCard";

interface UpgradeCardDialogProps {
  card: { id: string; tier: CardTier; balance: number; holder: string };
  allCards: { id: string; tier: CardTier; balance: number; label: string }[];
  onUpgraded: () => void;
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
  rewards: 0,
};

export function UpgradeCardDialog({ card, allCards, onUpgraded }: UpgradeCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [newTier, setNewTier] = useState<CardTier | null>(null);
  const [sourceCard, setSourceCard] = useState("");
  const [loading, setLoading] = useState(false);

  const currentIdx = tierOrder.indexOf(card.tier);
  const availableUpgrades = tierOrder.filter((_, i) => i > currentIdx);

  if (availableUpgrades.length === 0) return null;

  const selectedTier = newTier ? tierMeta[newTier] : null;
  const cost = newTier ? upgradeCosts[newTier] : 0;
  const canSelfFund = card.balance >= cost;
  const otherCards = allCards.filter((c) => c.id !== card.id && c.balance >= cost);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await fetch("/api/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: card.id,
          tier: newTier,
          sourceCardId: sourceCard || (canSelfFund ? card.id : undefined),
          upgradeCost: cost,
        }),
      });
      setOpen(false);
      setNewTier(null);
      setSourceCard("");
      onUpgraded();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-1.5">
          <RiArrowUpSLine className="w-3.5 h-3.5" />
          Улучшить
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Улучшить карту</DialogTitle>
          <DialogDescription>Текущий тариф: {tierMeta[card.tier].label}</DialogDescription>
        </DialogHeader>

        {!newTier ? (
          <div className="space-y-3">
            {availableUpgrades.map((tier) => {
              const meta = tierMeta[tier];
              const c = upgradeCosts[tier];
              const canAfford = card.balance >= c || otherCards.some((oc) => oc.balance >= c);
              return (
                <button
                  key={tier}
                  onClick={() => setNewTier(tier)}
                  className="w-full p-4 rounded-lg border hover:bg-accent/50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${meta.gradient} ring-1 ${meta.ring} flex items-center justify-center`}>
                      <RiIdCardLine className="w-5 h-5 text-white/80" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{meta.label}</span>
                        <Badge variant={canAfford ? "default" : "destructive"} className="text-xs">
                          {c.toLocaleString("ru")} МР
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Кэшбэк {meta.cashback} • {meta.price}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${selectedTier!.gradient} ring-1 ${selectedTier!.ring}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${selectedTier!.subtext}`}>Новый тариф</p>
                  <p className={`text-lg font-bold ${selectedTier!.textColor}`}>{selectedTier!.label}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs ${selectedTier!.subtext}`}>Стоимость</p>
                  <p className={`text-lg font-semibold ${selectedTier!.textColor}`}>{cost.toLocaleString("ru")} МР</p>
                </div>
              </div>
            </div>

            <Label>Списать с карты</Label>
            <div className="space-y-2">
              {canSelfFund && (
                <button
                  onClick={() => setSourceCard(card.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    sourceCard === card.id ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm ${tierMeta[card.tier].gradient}`} />
                      <span className="text-sm font-medium">{card.holder} (эта карта)</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{card.balance.toLocaleString("ru")} МР</span>
                  </div>
                </button>
              )}
              {otherCards.map((oc) => (
                <button
                  key={oc.id}
                  onClick={() => setSourceCard(oc.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    sourceCard === oc.id ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm ${tierMeta[oc.tier].gradient}`} />
                      <span className="text-sm font-medium">{oc.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{oc.balance.toLocaleString("ru")} МР</span>
                  </div>
                </button>
              ))}
            </div>

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setNewTier(null)}>Назад</Button>
              <Button variant="gradient" onClick={handleUpgrade} disabled={loading || !sourceCard}>
                {loading ? "Улучшение..." : "Улучшить"} <RiArrowRightUpLine className="w-4 h-4" />
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
