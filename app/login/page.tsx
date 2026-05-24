"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Shield, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"phone" | "password">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 5) {
      setError(null);
      setStep("password");
    } else {
      setError("Введите корректный номер или имя");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Try login first
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: phone, password }),
      });

      const loginData = await loginRes.json();

      if (loginRes.ok) {
        router.push("/dashboard");
        return;
      }

      // If user not found, auto-register
      if (loginRes.status === 404 && loginData.code === "USER_NOT_FOUND") {
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: phone, password, phone }),
        });

        if (regRes.ok) {
          router.push("/dashboard");
          return;
        }

        const regData = await regRes.json();
        setError(regData.error || "Ошибка регистрации");
      } else {
        setError(loginData.error || "Неверный пароль");
      }
    } catch (err) {
      setError("Произошла ошибка. Попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-b from-zinc-100 to-zinc-300 text-zinc-900 flex items-center justify-center font-bold text-sm shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset]">М</div>
              <span className="font-semibold">Маннру Банк</span>
            </div>
            <CardTitle className="text-xl">{step === "phone" ? "Вход в аккаунт" : "Введите пароль"}</CardTitle>
            <CardDescription>
              {step === "phone" ? "Введите номер телефона для входа" : `Код отправлен на ${phone}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                {error}
              </div>
            )}
            {step === "phone" ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Номер телефона или Логин</Label>
                  <Input id="phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (900) 000-00-00" autoFocus />
                </div>
                <Button type="submit" variant="gradient" className="w-full gap-2" disabled={loading}>
                  {loading ? "Загрузка..." : "Продолжить"} <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Пароль</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pr-10" autoFocus />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" variant="gradient" className="w-full gap-2" disabled={loading}>
                  {loading ? "Вход..." : "Войти"} <ArrowRight className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("phone")}>Изменить номер телефона</Button>
              </form>
            )}
          </CardContent>
          <CardFooter>
            <div className="flex items-center gap-2 text-xs text-muted-foreground w-full p-3 rounded-lg bg-secondary">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Ваши данные защищены 256-битным шифрованием
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="hidden lg:flex bg-secondary items-center justify-center p-12">
        <div className="max-w-sm text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-zinc-100 to-zinc-300 text-zinc-900 flex items-center justify-center font-bold text-4xl mx-auto shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_4px_12px_0_rgba(0,0,0,0.3)]">М</div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Банк нового поколения</h2>
            <p className="text-muted-foreground">Мгновенные переводы, кэшбэк до 15%, бонусы за каждое действие</p>
          </div>
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background">
              <Shield className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium">Безопасность</p>
                <p className="text-xs text-muted-foreground">Биометрия и двухфакторная аутентификация</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background">
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs font-bold">24</div>
              <div>
                <p className="text-sm font-medium">Поддержка</p>
                <p className="text-xs text-muted-foreground">Всегда на связи</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
