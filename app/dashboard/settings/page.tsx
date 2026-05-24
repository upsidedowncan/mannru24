"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Phone, Shield, Eye, LogOut, Terminal, Clock, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/db";

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-32 bg-zinc-900 rounded" /><div className="h-64 bg-zinc-900 rounded-xl" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white italic">Настройки</h1>
        <p className="text-muted-foreground text-sm mt-1 uppercase tracking-tighter">Ваше цифровое досье</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-zinc-950 border-zinc-900">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" /> Профиль
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-24 h-24 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                 <User className="w-10 h-10 text-zinc-500" />
              </div>
              <div className="flex-1 space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <Label className="text-[10px] uppercase text-zinc-500">Логин</Label>
                       <Input value={user?.name || ""} disabled className="bg-zinc-900 border-zinc-800 text-white" />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] uppercase text-zinc-500">Телефон</Label>
                       <Input value={user?.phone || "Не указан"} disabled className="bg-zinc-900 border-zinc-800 text-white" />
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1">
                        <Star className="w-3 h-3 mr-1.5 fill-current" /> Уровень {user?.level}
                    </Badge>
                    <Badge variant="outline" className="border-zinc-800 text-zinc-500 px-3 py-1">
                        ID: {user?.id.slice(0, 8)}...
                    </Badge>
                 </div>
              </div>
            </div>

            <Separator className="bg-zinc-900" />

            <div className="flex justify-end">
               <Button onClick={handleLogout} variant="destructive" size="sm" className="gap-2">
                  <LogOut className="w-4 h-4" /> Выйти из аккаунта
               </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-900 overflow-hidden">
          <CardHeader className="bg-zinc-900/50">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500" /> Логи кликов
            </CardTitle>
            <CardDescription className="text-[10px]">Система помнит всё.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-4">
                   {user?.clickHistory && user.clickHistory.length > 0 ? (
                     [...user.clickHistory].reverse().map((click, i) => (
                       <div key={i} className="space-y-1 border-l-2 border-zinc-900 pl-3 py-1">
                          <p className="text-[11px] text-zinc-200 leading-tight font-mono">{click.action}</p>
                          <div className="flex items-center gap-1.5 text-[9px] text-zinc-600 font-mono">
                             <Clock className="w-2.5 h-2.5" />
                             {new Date(click.timestamp).toLocaleTimeString()}
                          </div>
                       </div>
                     ))
                   ) : (
                     <p className="text-[10px] text-zinc-600 text-center py-10">История пуста. Подозрительно.</p>
                   )}
                </div>
             </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-950 border-zinc-900 border-dashed">
         <CardContent className="py-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
               <Shield className="w-6 h-6 text-zinc-700" />
            </div>
            <div className="space-y-1">
               <h3 className="font-bold text-zinc-400 uppercase tracking-tighter">Настройки безопасности</h3>
               <p className="text-[10px] text-zinc-600 max-w-xs mx-auto">
                  Двухфакторная аутентификация через подтверждение по взгляду в бездну временно недоступна.
               </p>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
