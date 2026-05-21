"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Gift,
  CheckSquare,
  ArrowLeftRight,
  History,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  Star,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useProgression } from "@/lib/progression";
import { pageUnlockLevel } from "@/lib/constants";

const navItems = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard, level: 1 },
  { href: "/dashboard/cards", label: "Карты", icon: CreditCard, level: 1 },
  { href: "/dashboard/history", label: "История", icon: History, level: 2 },
  { href: "/dashboard/transfers", label: "Переводы", icon: ArrowLeftRight, level: 3 },
  { href: "/dashboard/bonuses", label: "Бонусы", icon: Gift, level: 4 },
  { href: "/dashboard/tasks", label: "Задания", icon: CheckSquare, level: 5 },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { level, xp, currentXp, nextXp } = useProgression();

  return (
    <aside
      className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-background border-r transition-all duration-200 ${
        collapsed ? "w-[52px]" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between h-14 px-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center font-bold text-sm">М</div>
            <span className="font-semibold text-sm">Маннру</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-2 mb-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium">Уровень {level}</span>
          </div>
          <Progress value={nextXp > 0 ? (currentXp / nextXp) * 100 : 100} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground mt-1">{currentXp}/{nextXp} XP</p>
        </div>
      )}

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isLocked = level < item.level;
          return (
            <Link
              key={item.href}
              href={isLocked ? "#" : item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isLocked
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : isActive
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span>{item.label}</span>
                  {isLocked && <Lock className="w-3 h-3 ml-auto" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t space-y-1">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Настройки</span>}
        </Link>
        <button className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-accent/50 transition-colors w-full">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Выйти</span>}
        </button>
      </div>
    </aside>
  );
}
