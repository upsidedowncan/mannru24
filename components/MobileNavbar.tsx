"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiDashboardLine,
  RiBankCardLine,
  RiCheckboxLine,
  RiStore2Line,
  RiHistoryLine,
  RiStarFill,
  RiRocketLine,
  RiMoonLine,
  RiLockPasswordLine,
} from "react-icons/ri";
import { useProgression } from "@/lib/progression";

import { pageUnlockLevel } from "@/lib/constants";
import { isEventActive } from "@/lib/events";

const navItems = [
  { href: "/dashboard", label: "Главная", icon: RiDashboardLine },
  { href: "/dashboard/cards", label: "Карты", icon: RiBankCardLine },
  { href: "/dashboard/tasks", label: "Задания", icon: RiCheckboxLine },
  { href: "/dashboard/lariek", label: "Ларёк", icon: RiStore2Line },
  { href: "/dashboard/history", label: "История", icon: RiHistoryLine },
  { href: "/dashboard/bonuses", label: "Бонусы", icon: RiStarFill },
  { href: "/dashboard/games", label: "Игры", icon: RiRocketLine },
];

export function MobileNavbar() {
  const pathname = usePathname();
  const { level } = useProgression();
  const kurbanActive = isEventActive("kurban");

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-900 z-50 px-2 overflow-x-auto">
      <div className="flex items-center justify-around min-w-max h-16 pb-2 px-4 gap-2">
        {kurbanActive && (
          <Link
            href="/dashboard/event"
            className={`flex flex-col items-center justify-center gap-1 h-full px-2 min-w-[60px] relative ${
              pathname === "/dashboard/event" ? "text-emerald-500" : "text-emerald-500/60"
            }`}
          >
            <RiMoonLine className="w-5 h-5 fill-emerald-500/20" />
            <span className="text-[10px] font-medium text-center">Курбан</span>
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
              className={`flex flex-col items-center justify-center gap-1 h-full px-3 min-w-[64px] relative ${
                isLocked ? "text-muted-foreground/40" : isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isLocked && <RiLockPasswordLine className="w-2.5 h-2.5 absolute top-1 right-1" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
