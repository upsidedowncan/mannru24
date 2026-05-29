"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiLockLine, RiCheckboxCircleLine, RiCloseLine } from "react-icons/ri";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

function AuthorizeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [app, setApp] = useState<any>(null);

  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const responseType = searchParams.get("response_type");
  const scope = searchParams.get("scope");
  const state = searchParams.get("state");

  useEffect(() => {
    // Validate session and client
    const check = async () => {
      try {
        const [sessionRes, appRes] = await Promise.all([
          fetch("/api/auth/session"),
          fetch(`/api/oauth/client?client_id=${clientId}`)
        ]);

        if (!sessionRes.ok) {
          router.push(`/login?redirect=/oauth/authorize?${searchParams.toString()}`);
          return;
        }

        const sessionData = await sessionRes.json();
        if (!sessionData.user) {
            router.push(`/login?redirect=/oauth/authorize?${searchParams.toString()}`);
            return;
        }
        setUser(sessionData.user);

        if (!appRes.ok) {
          toast.error("Приложение не найдено");
          return;
        }
        setApp(await appRes.json());
      } catch (e) {
        toast.error("Ошибка авторизации");
      } finally {
        setLoading(false);
      }
    };

    if (clientId) check();
  }, [clientId, router, searchParams]);

  const handleApprove = async () => {
    try {
      const res = await fetch("/api/oauth/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, scope, state }),
      });
      const data = await res.json();
      if (res.ok && data.redirectUri) {
        window.location.href = data.redirectUri;
      } else {
        toast.error(data.error || "Ошибка");
      }
    } catch (e) {
      toast.error("Сетевая ошибка");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-secondary/30"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!app) return <div className="min-h-screen flex items-center justify-center bg-secondary/30 text-muted-foreground">Ошибка: неверные параметры запроса</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 rounded-2xl bg-foreground text-background flex items-center justify-center font-black text-4xl mx-auto mb-6 shadow-xl">М</div>
          <CardTitle className="text-2xl font-bold">Вход через Маннру ID</CardTitle>
          <CardDescription>Приложение <span className="font-bold text-foreground">{app.name}</span> запрашивает доступ к вашему аккаунту</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
             <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Разрешения:</p>
             <div className="flex items-center gap-3 text-sm">
                <RiCheckboxCircleLine className="text-emerald-500 w-5 h-5 shrink-0" />
                <span>Доступ к имени и номеру телефона</span>
             </div>
             <div className="flex items-center gap-3 text-sm">
                <RiCheckboxCircleLine className="text-emerald-500 w-5 h-5 shrink-0" />
                <span>Просмотр баланса ваших карт</span>
             </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
             <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm border">{user.name[0]}</div>
             <div>
                <p className="text-sm font-bold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.phone}</p>
             </div>
             <RiLockLine className="ml-auto text-primary w-4 h-4" />
          </div>

          <div className="flex flex-col gap-3">
             <Button onClick={handleApprove} className="h-12 text-base font-bold shadow-lg" variant="gradient">ПОДТВЕРДИТЬ</Button>
             <Button onClick={() => window.close()} variant="ghost" className="h-10 text-muted-foreground">ОТМЕНА</Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
            Нажимая «Подтвердить», вы разрешаете приложению использовать ваши данные в соответствии с <a href="#" className="underline">Политикой конфиденциальности</a> Маннру Банка.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthorizePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-secondary/30"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
            <AuthorizeContent />
        </Suspense>
    );
}
