"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiDashboardLine,
  RiBankCardLine,
  RiCheckboxLine,
  RiSendPlaneLine,
  RiHistoryLine,
  RiSettings4Line,
  RiLogoutBoxRLine,
  RiMoonLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiLockPasswordLine,
  RiStarFill,
  RiRocketLine,
  RiStore2Line,
  RiStockLine,
} from "react-icons/ri";
import { Progress } from "@/components/ui/progress";
import { useProgression } from "@/lib/progression";
import { pageUnlockLevel } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { isEventActive } from "@/lib/events";

const navItems = [
  { href: "/dashboard", label: "Главная", icon: RiDashboardLine },
  { href: "/dashboard/cards", label: "Карты", icon: RiBankCardLine },
  { href: "/dashboard/tasks", label: "Задания", icon: RiCheckboxLine },
  { href: "/dashboard/history", label: "История", icon: RiHistoryLine },
  { href: "/dashboard/transfers", label: "Переводы", icon: RiSendPlaneLine },
  { href: "/dashboard/bonuses", label: "Бонусы", icon: RiStarFill },
  { href: "/dashboard/games", label: "Игры", icon: RiRocketLine },
  { href: "/dashboard/lariek", label: "Ларёк", icon: RiStore2Line },
  { href: "/dashboard/investments", label: "Инвестиции", icon: RiStockLine },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { level, currentXp, nextXp } = useProgression();
  const kurbanActive = isEventActive("kurban");

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

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
          {collapsed ? <RiMenuUnfoldLine className="w-4 h-4" /> : <RiMenuFoldLine className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-2 mb-1.5">
            <RiStarFill className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium">Уровень {level}</span>
          </div>
          <Progress value={nextXp > 0 ? (currentXp / nextXp) * 100 : 100} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground mt-1">{currentXp}/{nextXp} XP</p>
        </div>
      )}

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {kurbanActive && (
          <Link
            href="/dashboard/event"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              pathname === "/dashboard/event"
                ? "bg-emerald-500/10 text-emerald-500 font-medium border border-emerald-500/20"
                : "text-emerald-500/70 hover:text-emerald-500 hover:bg-emerald-500/5"
            }`}
          >
            <RiMoonLine className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">Курбан-байрам</span>}
          </Link>
        )}
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const requiredLevel = pageUnlockLevel[item.href] || 1;
          const isLocked = level < requiredLevel;
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
                  <span className="truncate">{item.label}</span>
                  {isLocked && (
                    <div className="ml-auto flex items-center gap-1">
                      <span className="text-[10px] bg-zinc-800 px-1 rounded text-zinc-500">Lvl {requiredLevel}</span>
                      <RiLockPasswordLine className="w-3 h-3 text-zinc-600" />
                    </div>
                  )}
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
          <RiSettings4Line className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Настройки</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-accent/50 transition-colors w-full"
        >
          <RiLogoutBoxRLine className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Выйти</span>}
        </button>
      </div>
    </aside>
  );
}
