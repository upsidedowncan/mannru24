"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Check, X, Globe, Lock, User, CreditCard, BarChart3, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppInfo {
  id: string;
  name: string;
  redirectUrl: string;
  iconUrl?: string;
  scopes: string[];
}

interface UserInfo {
  id: string;
  name: string;
}

const SCOPE_META: Record<string, { icon: React.ReactNode; label: string; description: string }> = {
  "read:profile": {
    icon: <User className="w-4 h-4 text-blue-400" />,
    label: "Профиль",
    description: "Имя, уровень и публичная информация аккаунта",
  },
  "read:balance": {
    icon: <CreditCard className="w-4 h-4 text-emerald-400" />,
    label: "Баланс",
    description: "Просмотр баланса карт и бонусных баллов",
  },
  "read:transactions": {
    icon: <BarChart3 className="w-4 h-4 text-violet-400" />,
    label: "История транзакций",
    description: "Чтение истории операций по картам",
  },
  "write:transfers": {
    icon: <Globe className="w-4 h-4 text-orange-400" />,
    label: "Переводы",
    description: "Совершение переводов от вашего имени",
  },
};

function scopeMeta(scope: string) {
  return (
    SCOPE_META[scope] ?? {
      icon: <Lock className="w-4 h-4 text-zinc-400" />,
      label: scope,
      description: "Специальный доступ: " + scope,
    }
  );
}

function OAuthAuthorizeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const clientId = searchParams.get("client_id") ?? "";
  const redirectUri = searchParams.get("redirect_uri") ?? "";
  const state = searchParams.get("state") ?? "";

  const [app, setApp] = useState<AppInfo | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!clientId || !redirectUri) {
      setError("Некорректная ссылка авторизации: отсутствуют обязательные параметры.");
      setLoading(false);
      return;
    }

    const load = async () => {
      const [appRes, userRes] = await Promise.all([
        fetch(`/api/oauth/apps?client_id=${encodeURIComponent(clientId)}`),
        fetch("/api/user"),
      ]);

      if (!appRes.ok) {
        setError("Приложение не найдено или client_id недействителен.");
        setLoading(false);
        return;
      }

      const appData = await appRes.json();

      if (!userRes.ok) {
        const params = new URLSearchParams({ redirect: window.location.href });
        router.replace(`/login?${params}`);
        return;
      }

      const userData = await userRes.json();
      if (!userData.id) {
        const params = new URLSearchParams({ redirect: window.location.href });
        router.replace(`/login?${params}`);
        return;
      }

      // Validate redirect URI matches what the app registered
      if (appData.redirectUrl !== redirectUri) {
        setError("redirect_uri не совпадает с зарегистрированным адресом приложения.");
        setLoading(false);
        return;
      }

      setApp(appData);
      setUser({ id: userData.id, name: userData.name });
      setLoading(false);
    };

    load();
  }, [clientId, redirectUri, router]);

  const handleApprove = async () => {
    if (!app || !user) return;
    setSubmitting(true);

    const res = await fetch("/api/oauth/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, redirectUri }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Ошибка авторизации");
      setSubmitting(false);
      return;
    }

    const { token } = await res.json();
    const dest = new URL(redirectUri);
    dest.searchParams.set("code", token);
    if (state) dest.searchParams.set("state", state);
    window.location.href = dest.toString();
  };

  const handleDeny = () => {
    const dest = new URL(redirectUri || window.location.origin);
    dest.searchParams.set("error", "access_denied");
    if (state) dest.searchParams.set("state", state);
    window.location.href = dest.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg">Ошибка авторизации</h1>
            <p className="text-zinc-400 text-sm mt-1">{error}</p>
          </div>
          <button onClick={() => router.back()} className="text-sm text-zinc-500 hover:text-white transition-colors">
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  if (!app || !user) return null;

  const hasHighRiskScopes = app.scopes.some(s => s.startsWith("write:"));

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-0">
        {/* Card */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 text-center">
            <div className="relative inline-flex items-center justify-center mb-4">
              {/* App icon */}
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shadow-lg">
                {app.iconUrl ? (
                  <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" />
                ) : (
                  <Globe className="w-8 h-8 text-zinc-400" />
                )}
              </div>
              {/* Connection indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-700">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
            </div>

            <h1 className="text-white font-bold text-lg leading-tight">
              <span className="text-zinc-400 font-normal">Приложение</span> {app.name}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              запрашивает доступ к вашему аккаунту{" "}
              <span className="text-zinc-300 font-medium">{user.name}</span>
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-zinc-800 mx-6" />

          {/* Scopes */}
          <div className="px-6 py-4 space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold">
              Запрошенные разрешения
            </p>

            {app.scopes.length === 0 ? (
              <div className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-300 font-medium">Базовая идентификация</p>
                  <p className="text-xs text-zinc-500">Только имя и ID аккаунта</p>
                </div>
              </div>
            ) : (
              app.scopes.map(scope => {
                const meta = scopeMeta(scope);
                return (
                  <div key={scope} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                      {meta.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-300 font-medium">{meta.label}</p>
                      <p className="text-xs text-zinc-500">{meta.description}</p>
                    </div>
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                  </div>
                );
              })
            )}
          </div>

          {hasHighRiskScopes && (
            <>
              <div className="h-px bg-zinc-800 mx-6" />
              <div className="px-6 py-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-500/80">
                  Это приложение запрашивает разрешения на запись. Убедитесь, что доверяете ему.
                </p>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="h-px bg-zinc-800 mx-6" />

          {/* Security note */}
          <div className="px-6 py-3 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <p className="text-[11px] text-zinc-500">
              Маннру Банк никогда не передаёт пароль третьим сервисам
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-zinc-800" />

          {/* Actions */}
          <div className="p-4 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleDeny}
              disabled={submitting}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <X className="w-4 h-4 mr-1.5" />
              Отказать
            </Button>
            <Button
              onClick={handleApprove}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Разрешить
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-zinc-600 mt-4 font-mono">
          Авторизация действительна 1 час · MANNHAXORS v1.0
        </p>
      </div>
    </div>
  );
}

export default function OAuthAuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-zinc-800 border-t-red-600 animate-spin" />
        </div>
      }
    >
      <OAuthAuthorizeContent />
    </Suspense>
  );
}
