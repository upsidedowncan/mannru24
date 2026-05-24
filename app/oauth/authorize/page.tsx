"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface OAuthAppInfo {
  id: string;
  name: string;
  url: string;
  icon: string;
  scopes: string[];
}

interface CurrentUser {
  id: string;
  name: string;
}

function AuthorizeContent() {
  const params = useSearchParams();
  const router = useRouter();
  const clientId = params.get("client_id");
  const redirectUri = params.get("redirect_uri") ?? "";
  const state = params.get("state") ?? "";

  const [app, setApp] = useState<OAuthAppInfo | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!clientId) {
        setError("Missing client_id");
        setLoading(false);
        return;
      }

      try {
        const [meRes, appRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch(`/api/oauth/apps?client_id=${encodeURIComponent(clientId)}`),
        ]);

        if (!meRes.ok) {
          const next = encodeURIComponent(`/oauth/authorize?${params.toString()}`);
          router.push(`/login?next=${next}`);
          return;
        }
        const meData = await meRes.json();
        setUser({ id: meData.id, name: meData.name });

        if (!appRes.ok) {
          setError("Приложение не найдено");
          setLoading(false);
          return;
        }
        const appData = await appRes.json();
        setApp(appData);
      } catch {
        setError("Не удалось загрузить данные приложения");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [clientId, params, router]);

  const handleApprove = async () => {
    if (!app) return;
    setSubmitting(true);
    try {
      // Маннру дать вам многа деньга — Банк Маннру нифига не знает что произойдёт
      toast.success("Подтверждено. Банк Маннру обрабатывает запрос…");

      if (redirectUri) {
        const url = new URL(redirectUri);
        url.searchParams.set("client_id", app.id);
        if (state) url.searchParams.set("state", state);
        url.searchParams.set("status", "approved");
        window.location.href = url.toString();
      } else {
        router.push("/dashboard");
      }
    } catch {
      toast.error("Что-то пошло не так");
      setSubmitting(false);
    }
  };

  const handleDeny = () => {
    if (redirectUri) {
      try {
        const url = new URL(redirectUri);
        url.searchParams.set("error", "access_denied");
        if (state) url.searchParams.set("state", state);
        window.location.href = url.toString();
        return;
      } catch {
        // fallthrough
      }
    }
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center shadow-2xl">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-zinc-100">Ошибка</h1>
          <p className="text-sm text-zinc-400 mt-2">{error ?? "Приложение недоступно"}</p>
          <Button onClick={() => router.push("/dashboard")} variant="outline" className="mt-4">
            На главную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center p-4">
      <div
        className="w-full max-w-md relative rounded-3xl overflow-hidden border border-white/10"
        style={{
          background:
            "linear-gradient(180deg, rgba(39,39,42,1) 0%, rgba(24,24,27,1) 60%, rgba(9,9,11,1) 100%)",
          boxShadow:
            "0 30px 60px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.5)",
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(59,130,246,0.6),inset_0_1px_0_rgba(255,255,255,0.4)]">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold">
              Маннру · Авторизация
            </p>
          </div>
        </div>

        <div className="px-6 pt-6 pb-2 flex flex-col items-center text-center">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800 flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-2px_0_rgba(0,0,0,0.5)] border border-white/10"
            >
              {app.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-zinc-300">{app.name.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_4px_8px_-2px_rgba(16,185,129,0.6),inset_0_1px_0_rgba(255,255,255,0.4)] border-2 border-zinc-900">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <h1 className="mt-5 text-2xl font-bold text-white">
            {app.name}
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5 break-all">{app.url}</p>
          <p className="text-sm text-zinc-300 mt-4 max-w-[300px]">
            хочет получить доступ к вашему аккаунту <span className="font-semibold text-white">Маннру</span>
            {user && <> · <span className="text-blue-300">{user.name}</span></>}
          </p>
        </div>

        <div className="px-6 py-5">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">
            Это позволит {app.name}:
          </p>
          <ul className="space-y-2.5">
            {app.scopes.map((scope, idx) => (
              <li
                key={`${scope}-${idx}`}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <div className="mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-[0_2px_6px_-1px_rgba(16,185,129,0.5),inset_0_1px_0_rgba(255,255,255,0.4)]">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                <span className="text-sm text-zinc-200">{scope}</span>
              </li>
            ))}

            <li
              className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              <div className="mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0 shadow-[0_2px_6px_-1px_rgba(239,68,68,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]">
                <X className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
              <span className="text-sm text-zinc-200">дать вам многа деньга</span>
            </li>
          </ul>
        </div>

        <div className="px-6 pb-6 pt-2 space-y-3">
          <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
            Нажимая «Подтвердить», вы соглашаетесь с тем, что{" "}
            <span className="text-zinc-300">Банк Маннру</span> просто нифига не знает,
            что произойдёт дальше.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleDeny}
              disabled={submitting}
              className="flex-1 h-11 rounded-xl text-sm font-semibold text-zinc-200 bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 active:from-zinc-800 active:to-zinc-900 border border-white/5 shadow-[0_4px_10px_-2px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-2px_0_rgba(0,0,0,0.4)] transition-all disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-gradient-to-b from-blue-400 via-blue-500 to-blue-700 hover:from-blue-300 hover:via-blue-400 hover:to-blue-600 active:from-blue-600 active:to-blue-800 border border-blue-400/40 shadow-[0_6px_16px_-4px_rgba(59,130,246,0.6),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Подтвердить"}
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <AuthorizeContent />
    </Suspense>
  );
}
