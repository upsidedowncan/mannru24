"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LockClosedIcon, CheckCircledIcon, Cross1Icon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AuthorizePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuthorize = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Авторизация успешна");
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950">
      <Card className="w-full max-w-md border-zinc-900 bg-zinc-950">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl relative">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-b from-zinc-100 to-zinc-300 text-zinc-900 flex items-center justify-center font-bold text-2xl">М</div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-zinc-950 flex items-center justify-center">
                <CheckCircledIcon className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Разрешить доступ?</CardTitle>
          <CardDescription className="text-zinc-500 mt-2">
            Приложение <span className="text-zinc-200 font-medium">«Mannru Mobile»</span> запрашивает доступ к вашему аккаунту.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Приложение получит доступ к:</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <LockClosedIcon className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-200">Личные данные</p>
                <p className="text-xs text-zinc-500">Имя пользователя, телефон и уровень</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <LockClosedIcon className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-200">Управление картами</p>
                <p className="text-xs text-zinc-500">Просмотр баланса и создание транзакций</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <LockClosedIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <p className="text-[10px] text-emerald-500/80 leading-tight">
              Безопасное соединение. Mannru Auth не передает ваш пароль сторонним приложениям.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-6">
          <Button
            onClick={handleAuthorize}
            disabled={loading}
            variant="gradient"
            className="w-full h-12 font-bold shadow-[0_8px_20px_rgba(59,130,246,0.3)]"
          >
            {loading ? "Авторизация..." : "Разрешить"}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-zinc-500 hover:text-zinc-300"
            onClick={() => router.push("/")}
          >
            Отклонить
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
