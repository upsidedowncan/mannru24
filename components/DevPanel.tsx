"use client";

import { useState, useEffect } from "react";
import {
  RiHammerLine,
  RiFlashlightLine,
  RiExchangeLine,
  RiEyeLine,
  RiEyeOffLine,
  RiShieldLine,
  RiStarFill,
  RiCloseLine,
  RiSettings4Line
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useProgression } from "@/lib/progression";
import type { UserProfile } from "@/lib/db";

export function DevPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { refresh: refreshProgression } = useProgression();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [xpAmount, setXpAmount] = useState("100");
  const [moneyAmount, setMoneyAmount] = useState("1000");

  const fetchUser = async () => {
      const res = await fetch("/api/user");
      if (res.ok) setUser(await res.json());
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (user?.phone !== "+79268911629") return null;

  const handleAddXp = async () => {
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xpAdd: parseInt(xpAmount) }),
      });
      if (res.ok) {
        toast.success(`Добавлено ${xpAmount} XP`);
        fetchUser();
        refreshProgression();
      }
    } catch (e) {
      toast.error("Ошибка");
    }
  };

  const handleAddMoney = async () => {
    try {
      const res = await fetch("/api/cards");
      const cards = await res.json();
      if (cards.length > 0) {
        const res2 = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "DEV_INJECTION",
            category: "Система",
            amount: parseInt(moneyAmount),
            cardId: cards[0].id
          }),
        });
        if (res2.ok) {
          toast.success(`Начислено ${moneyAmount} MR`);
          fetchUser();
          refreshProgression();
        }
      }
    } catch (e) {
      toast.error("Ошибка");
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-20 right-4 z-50 rounded-full shadow-lg bg-zinc-900 border-zinc-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <RiSettings4Line className={`w-5 h-5 ${isOpen ? "rotate-90" : ""} transition-transform`} />
      </Button>

      {isOpen && (
        <Card className="fixed bottom-32 right-4 z-50 w-64 shadow-2xl border-primary/20">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <RiHammerLine className="text-primary" /> DEV PANEL
            </CardTitle>
            <button onClick={() => setIsOpen(false)}><RiCloseLine className="w-4 h-4" /></button>
          </CardHeader>
          <CardContent className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Modify XP</label>
              <div className="flex gap-2">
                <Input size={1} value={xpAmount} onChange={e => setXpAmount(e.target.value)} className="h-8 text-xs font-mono" />
                <Button size="sm" variant="secondary" className="h-8" onClick={handleAddXp}><RiFlashlightLine /></Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Modify Money</label>
              <div className="flex gap-2">
                <Input size={1} value={moneyAmount} onChange={e => setMoneyAmount(e.target.value)} className="h-8 text-xs font-mono" />
                <Button size="sm" variant="secondary" className="h-8" onClick={handleAddMoney}><RiExchangeLine /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
