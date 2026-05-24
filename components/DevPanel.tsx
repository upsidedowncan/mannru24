"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Terminal, Zap, Star, X, Trash2, Plus, AppWindow } from "lucide-react";
import { toast } from "sonner";
import { useProgression } from "@/lib/progression";

const DEV_PHONE = "+79268911629";

interface OAuthApp {
  id: string;
  name: string;
  url: string;
  icon: string;
  scopes: string[];
  createdAt: string;
}

export function DevPanel() {
  const [show, setShow] = useState(false);
  const [userPhone, setUserPhone] = useState("");
  const [xpAdd, setXpAdd] = useState("100");
  const [lvlTarget, setLvlTarget] = useState("15");
  const [moneyAdd, setMoneyAdd] = useState("10000");
  const [cards, setCards] = useState<any[]>([]);
  const { refresh } = useProgression();

  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [appName, setAppName] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [appIcon, setAppIcon] = useState("");
  const [scopeInput, setScopeInput] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);

  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (data.phone === DEV_PHONE) {
        setUserPhone(data.phone);
        const cRes = await fetch("/api/cards");
        setCards(await cRes.json());
        loadApps();
      }
    };
    check();
  }, []);

  const loadApps = async () => {
    const res = await fetch("/api/dev/oauth-apps");
    if (res.ok) {
      const data = await res.json();
      setApps(data.apps ?? []);
    }
  };

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

  const addScope = () => {
    const s = scopeInput.trim();
    if (!s) return;
    if (scopes.includes(s)) {
      setScopeInput("");
      return;
    }
    setScopes([...scopes, s]);
    setScopeInput("");
  };

  const removeScope = (s: string) => setScopes(scopes.filter(x => x !== s));

  const createApp = async () => {
    if (!appName.trim() || !appUrl.trim()) {
      toast.error("Name and URL required");
      return;
    }
    const res = await fetch("/api/dev/oauth-apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: appName, url: appUrl, icon: appIcon, scopes }),
    });
    if (res.ok) {
      const data = await res.json();
      setApps(data.apps ?? []);
      setAppName("");
      setAppUrl("");
      setAppIcon("");
      setScopes([]);
      toast.success("OAuth app created");
    } else {
      toast.error("Failed to create app");
    }
  };

  const deleteApp = async (id: string) => {
    const res = await fetch("/api/dev/oauth-apps", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      const data = await res.json();
      setApps(data.apps ?? []);
      toast.success("App deleted");
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
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 shadow-2xl relative my-8">
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

              <div className="space-y-3 border-t border-zinc-800 pt-4">
                <Label className="text-[10px] uppercase text-zinc-500 flex items-center gap-1.5">
                  <AppWindow className="w-3 h-3" /> OAuth Apps
                </Label>

                <div className="space-y-2 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                  <Input
                    placeholder="App name"
                    value={appName}
                    onChange={e => setAppName(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 h-8 text-xs"
                  />
                  <Input
                    placeholder="App URL (https://...)"
                    value={appUrl}
                    onChange={e => setAppUrl(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 h-8 text-xs"
                  />
                  <Input
                    placeholder="Icon URL"
                    value={appIcon}
                    onChange={e => setAppIcon(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 h-8 text-xs"
                  />

                  <div className="flex gap-2">
                    <Input
                      placeholder="Add scope (e.g. read profile)"
                      value={scopeInput}
                      onChange={e => setScopeInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addScope();
                        }
                      }}
                      className="bg-zinc-950 border-zinc-800 h-8 text-xs"
                    />
                    <Button onClick={addScope} size="sm" variant="outline" className="h-8 w-8 p-0">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  {scopes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {scopes.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-200 text-[10px] px-2 py-0.5 rounded-full">
                          {s}
                          <button onClick={() => removeScope(s)} className="text-zinc-500 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <Button onClick={createApp} size="sm" variant="gradient" className="w-full h-8 text-xs">
                    Create App
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {apps.length === 0 && (
                    <p className="text-[10px] text-zinc-600 text-center">No apps yet</p>
                  )}
                  {apps.map(a => (
                    <div key={a.id} className="flex items-center gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                      {a.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.icon} alt={a.name} className="w-6 h-6 rounded object-cover bg-zinc-800" />
                      ) : (
                        <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">
                          {a.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-zinc-200 truncate">{a.name}</p>
                        <p className="text-[9px] text-zinc-500 font-mono truncate">{a.id}</p>
                      </div>
                      <button onClick={() => deleteApp(a.id)} className="text-zinc-500 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
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
