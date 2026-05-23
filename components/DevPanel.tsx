"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Terminal, Plus, Zap, Star, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { useProgression } from "@/lib/progression";

const DEV_PHONE = "+79268911629";

export function DevPanel() {
  const [show, setShow] = useState(false);
  const [userPhone, setUserPhone] = useState("");
  const [xpAdd, setXpAdd] = useState("100");
  const [lvlTarget, setLvlTarget] = useState("15");
  const [moneyAdd, setMoneyAdd] = useState("10000");
  const [cards, setCards] = useState<any[]>([]);
  const { refresh } = useProgression();

  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (data.phone === DEV_PHONE) {
        setUserPhone(data.phone);
        const cRes = await fetch("/api/cards");
        setCards(await cRes.json());
      }
    };
    check();
  }, []);

  if (userPhone !== DEV_PHONE) return null;

  const handleAction = async (type: string, amount: string, cardId?: string) => {
    const res = await fetch("/api/dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, amount, cardId }),
    });
    if (res.ok) {
      toast.success("DEV: Action successful");
      refresh();
    }
  };

  return (
    <>
      <button
        onClick={() => setShow(!show)}
        className="fixed bottom-20 right-4 z-[60] w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl border-2 border-white/20 hover:scale-110 transition-all"
      >
        <Terminal className="w-5 h-5" />
      </button>

      {show && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 shadow-2xl relative">
            <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                <Terminal className="w-5 h-5" /> DEV CONSOLE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-zinc-500">Add XP</Label>
                  <div className="flex gap-2">
                    <Input value={xpAdd} onChange={e => setXpAdd(e.target.value)} className="bg-zinc-900 border-zinc-800 h-8 text-xs" />
                    <Button onClick={() => handleAction("xp", xpAdd)} size="sm" variant="outline" className="h-8 w-8 p-0"><Zap className="w-3 h-3" /></Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-zinc-500">Set Level</Label>
                  <div className="flex gap-2">
                    <Input value={lvlTarget} onChange={e => setLvlTarget(e.target.value)} className="bg-zinc-900 border-zinc-800 h-8 text-xs" />
                    <Button onClick={() => handleAction("level", lvlTarget)} size="sm" variant="outline" className="h-8 w-8 p-0"><Star className="w-3 h-3" /></Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] uppercase text-zinc-500">Inject Money</Label>
                {cards.map(c => (
                  <div key={c.id} className="flex items-center gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-zinc-300">{c.tier.toUpperCase()} ••{c.number.slice(-4)}</p>
                      <p className="text-[10px] text-zinc-500">{c.balance} MR</p>
                    </div>
                    <Input value={moneyAdd} onChange={e => setMoneyAdd(e.target.value)} className="w-20 bg-zinc-950 border-zinc-800 h-7 text-[10px]" />
                    <Button onClick={() => handleAction("money", moneyAdd, c.id)} size="sm" variant="gradient" className="h-7 px-2 text-[10px]">Add</Button>
                  </div>
                ))}
              </div>

              <p className="text-[9px] text-zinc-600 font-mono text-center">
                THIS PANEL IS ONLY VISIBLE TO +79268911629. USE RESPONSIBLY (OR NOT).
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
