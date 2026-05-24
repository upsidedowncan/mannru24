"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Terminal, Plus, Zap, Star, Wallet, X, Globe, Trash2, Key } from "lucide-react";
import { toast } from "sonner";
import { useProgression } from "@/lib/progression";

const DEV_UUID = "62734945-0f34-4ae1-b6e2-1e2939fb09d3";

interface OAuthApp {
  id: string;
  name: string;
  redirectUrl: string;
  iconUrl?: string;
  scopes: string[];
  clientId: string;
}

export function DevPanel() {
  const [show, setShow] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [activeTab, setActiveTab] = useState<"dev" | "oauth">("dev");
  const [xpAdd, setXpAdd] = useState("100");
  const [lvlTarget, setLvlTarget] = useState("15");
  const [moneyAdd, setMoneyAdd] = useState("10000");
  const [cards, setCards] = useState<any[]>([]);

  // OAuth apps state
  const [oauthApps, setOauthApps] = useState<OAuthApp[]>([]);
  const [appName, setAppName] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [scopeInput, setScopeInput] = useState("");

  const { refresh } = useProgression();

  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (data.id === DEV_UUID) {
        setIsDev(true);
        const cRes = await fetch("/api/cards");
        setCards(await cRes.json());
        const oRes = await fetch("/api/dev/oauth-apps");
        if (oRes.ok) setOauthApps(await oRes.json());
      }
    };
    check();
  }, []);

  if (!isDev) return null;

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

  const handleAddScope = () => {
    const s = scopeInput.trim();
    if (s && !scopes.includes(s)) {
      setScopes([...scopes, s]);
    }
    setScopeInput("");
  };

  const handleRemoveScope = (scope: string) => {
    setScopes(scopes.filter(s => s !== scope));
  };

  const handleCreateOAuthApp = async () => {
    if (!appName || !redirectUrl) {
      toast.error("App name and redirect URL are required");
      return;
    }
    const res = await fetch("/api/dev/oauth-apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: appName, redirectUrl, iconUrl, scopes }),
    });
    if (res.ok) {
      const created = await res.json();
      setOauthApps(prev => [...prev, created]);
      setAppName("");
      setRedirectUrl("");
      setIconUrl("");
      setScopes([]);
      toast.success("OAuth app created");
    } else {
      toast.error("Failed to create OAuth app");
    }
  };

  const handleDeleteOAuthApp = async (id: string) => {
    const res = await fetch(`/api/dev/oauth-apps/${id}`, { method: "DELETE" });
    if (res.ok) {
      setOauthApps(prev => prev.filter(a => a.id !== id));
      toast.success("OAuth app deleted");
    } else {
      toast.error("Failed to delete OAuth app");
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
          <Card className="w-full max-w-lg bg-zinc-950 border-zinc-800 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-10">
              <X className="w-5 h-5" />
            </button>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-red-500">
                <Terminal className="w-5 h-5" /> DEV CONSOLE
              </CardTitle>
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => setActiveTab("dev")}
                  className={`px-3 py-1 text-[10px] uppercase font-bold rounded transition-colors ${activeTab === "dev" ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"}`}
                >
                  Tools
                </button>
                <button
                  onClick={() => setActiveTab("oauth")}
                  className={`px-3 py-1 text-[10px] uppercase font-bold rounded transition-colors flex items-center gap-1 ${activeTab === "oauth" ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"}`}
                >
                  <Key className="w-3 h-3" /> OAuth Apps
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 overflow-y-auto flex-1 pr-2">
              {activeTab === "dev" && (
                <>
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
                </>
              )}

              {activeTab === "oauth" && (
                <>
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase text-zinc-500 tracking-widest">Create OAuth App</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="App name"
                        value={appName}
                        onChange={e => setAppName(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 h-8 text-xs"
                      />
                      <Input
                        placeholder="Redirect URL (https://...)"
                        value={redirectUrl}
                        onChange={e => setRedirectUrl(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 h-8 text-xs"
                      />
                      <Input
                        placeholder="Icon URL (optional)"
                        value={iconUrl}
                        onChange={e => setIconUrl(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase text-zinc-500">Scopes</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. read:profile"
                          value={scopeInput}
                          onChange={e => setScopeInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddScope(); } }}
                          className="bg-zinc-900 border-zinc-800 h-8 text-xs"
                        />
                        <Button onClick={handleAddScope} size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0">
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      {scopes.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {scopes.map(scope => (
                            <span key={scope} className="flex items-center gap-1 bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                              {scope}
                              <button onClick={() => handleRemoveScope(scope)} className="text-zinc-500 hover:text-red-400 transition-colors">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button onClick={handleCreateOAuthApp} size="sm" className="w-full h-8 text-xs bg-red-600 hover:bg-red-700 text-white">
                      <Plus className="w-3 h-3 mr-1" /> Create App
                    </Button>
                  </div>

                  {oauthApps.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase text-zinc-500 tracking-widest">Created Apps</Label>
                      {oauthApps.map(app => (
                        <div key={app.id} className="flex items-start gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                          {app.iconUrl ? (
                            <img src={app.iconUrl} alt="" className="w-6 h-6 rounded object-cover shrink-0 mt-0.5" />
                          ) : (
                            <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                              <Globe className="w-3 h-3 text-zinc-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-zinc-200 truncate">{app.name}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{app.redirectUrl}</p>
                            {app.scopes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {app.scopes.map(s => (
                                  <span key={s} className="bg-zinc-800 text-zinc-400 text-[9px] px-1.5 py-0 rounded-full font-mono">{s}</span>
                                ))}
                              </div>
                            )}
                            <p className="text-[9px] text-zinc-600 font-mono mt-1 truncate">client_id: {app.clientId}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteOAuthApp(app.id)}
                            className="text-zinc-600 hover:text-red-500 transition-colors shrink-0 mt-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <p className="text-[9px] text-zinc-600 font-mono text-center pt-2">
                THIS PANEL IS ONLY VISIBLE TO THE DEV BOSS UUID. MANNHAXORS v1.0
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
