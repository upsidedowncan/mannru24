"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiRocketLine, RiCrosshairLine, RiGridLine, RiRefreshLine, RiBankLine } from "react-icons/ri";
import Link from "next/link";

const games = [
  {
    id: "slots",
    title: "Слоты",
    description: "Испытай удачу в игровом автомате.",
    icon: RiRefreshLine,
    color: "bg-amber-500/10 text-amber-500",
    href: "/dashboard/games/slots",
    tag: "Популярно",
  },
  {
    id: "roulette",
    title: "Рулетка",
    description: "Выживи и удвой свой капитал.",
    icon: RiCrosshairLine,
    color: "bg-red-500/10 text-red-500",
    href: "/dashboard/games/roulette",
    tag: "Hardcore",
  },
  {
    id: "ttt",
    title: "Крестики-Нолики",
    description: "Победи ИИ в классической игре.",
    icon: RiGridLine,
    color: "bg-blue-500/10 text-blue-500",
    href: "/dashboard/games/ttt",
    tag: "Новинка",
  },
  {
    id: "coinflip",
    title: "Орел и Решка",
    description: "Классическая игра на удачу 50/50.",
    icon: RiRefreshLine,
    color: "bg-yellow-500/10 text-yellow-500",
    href: "/dashboard/games/coinflip",
    tag: "Легко",
  },
  {
    id: "cbrate",
    title: "Ставка ЦБ",
    description: "Угадайте решение Банка Маннру по ключевой ставке. До ×12 выплата.",
    icon: RiBankLine,
    color: "bg-emerald-500/10 text-emerald-500",
    href: "/dashboard/games/cbrate",
    tag: "Новинка",
  },
];

export default function GamesPage() {
  return (
    <div className="space-y-6 px-4 md:px-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Игры</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Развлекайтесь и зарабатывайте (или теряйте) МР
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={game.href}>
              <Card className="hover:bg-zinc-900/50 transition-colors h-full border-zinc-800 bg-zinc-950">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-lg ${game.color}`}>
                      <game.icon className="w-5 h-5" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-zinc-900 text-zinc-400 border-zinc-800">
                      {game.tag}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{game.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2 text-zinc-500">
                    {game.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 flex items-center group">
                    Играть <RiRocketLine className="ml-1.5 w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
