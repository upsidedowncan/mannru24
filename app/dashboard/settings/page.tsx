"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  RiUserLine,
  RiSmartphoneLine,
  RiLockLine,
  RiEyeLine,
  RiLogoutBoxRLine,
  RiCodeLine,
  RiTimeLine,
  RiStarFill,
} from "react-icons/ri";
import { toast } from "sonner";
import { useProgression } from "@/lib/progression";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { UserProfile, ClickRecord } from "@/lib/db";

export default function SettingsPage() {
  const { refresh } = useProgression();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/user").then(res => res.json()).then(setUser);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground text-sm mt-1">Управление профилем и безопасностью</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RiUserLine className="w-4 h-4 text-primary" /> Личные данные
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Имя пользователя</Label>
                  <Input value={user.name} readOnly className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>Номер телефона</Label>
                  <Input value={user.phone} readOnly className="bg-secondary/50" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RiLockLine className="w-4 h-4 text-primary" /> Безопасность
              </CardTitle>
              <CardDescription>Настройки защиты вашего аккаунта</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Двухфакторная аутентификация</Label>
                  <p className="text-xs text-muted-foreground">Дополнительная защита при входе</p>
                </div>
                <Switch disabled />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Уведомления о входе</Label>
                  <p className="text-xs text-muted-foreground">Получать SMS при каждом входе</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button variant="outline" className="w-full sm:w-auto">Изменить пароль</Button>
            </CardContent>
          </Card>

          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="text-base text-red-500 flex items-center gap-2">
                <RiLogoutBoxRLine className="w-4 h-4" /> Выход
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Вы можете выйти из аккаунта на этом устройстве.</p>
              <Button variant="destructive" onClick={handleLogout}>Выйти из системы</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RiStarFill className="w-4 h-4 text-amber-500" /> Статус
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Уровень</span>
                <Badge variant="secondary" className="font-bold">{user.level}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Опыт</span>
                <span className="text-sm font-medium">{user.xp} XP</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Регистрация</span>
                <span className="text-sm font-medium">10.05.2024</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RiTimeLine className="w-4 h-4 text-primary" /> Прозрачность
              </CardTitle>
              <CardDescription>Последняя активность</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(user.clickHistory || []).slice(-5).reverse().map((rec: ClickRecord, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{rec.action}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
