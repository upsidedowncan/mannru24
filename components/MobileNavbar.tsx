"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, Gift, CheckSquare, History, Lock } from "lucide-react";
import { useProgression } from "@/lib/progression";

import { pageUnlockLevel } from "@/lib/constants";

const navItems = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
  { href: "/dashboard/cards", label: "Карты", icon: CreditCard },
  { href: "/dashboard/tasks", label: "Задания", icon: CheckSquare },
  { href: "/dashboard/history", label: "История", icon: History },
  { href: "/dashboard/bonuses", label: "Бонусы", icon: Gift },
];

export function MobileNavbar() {
  const pathname = usePathname();
  const { level } = useProgression();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/90 border-t border-zinc-900 z-50">
      <div className="flex items-center justify-around h-16 pb-1">
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
              {isLocked && <Lock className="w-2.5 h-2.5 absolute top-1 right-1" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
