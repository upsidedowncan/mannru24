"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RocketIcon, TargetIcon, DiscIcon, GridIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";

const games = [
  {
    id: "slots",
    title: "Слоты",
    description: "Испытай удачу в игровом автомате.",
    icon: DiscIcon,
    color: "bg-amber-500/10 text-amber-500",
    href: "/dashboard/games/slots",
    tag: "Популярно",
  },
  {
    id: "roulette",
    title: "Рулетка",
    description: "Выживи и удвой свой капитал.",
    icon: TargetIcon,
    color: "bg-red-500/10 text-red-500",
    href: "/dashboard/games/roulette",
    tag: "Hardcore",
  },
  {
    id: "ttt",
    title: "Крестики-Нолики",
    description: "Победи ИИ в классической игре.",
    icon: GridIcon,
    color: "bg-blue-500/10 text-blue-500",
    href: "/dashboard/games/ttt",
    tag: "Новинка",
  },
];

export default function GamesPage() {
  return (
    <div className="space-y-6">
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
              <Card className="hover:bg-accent/50 transition-colors h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-lg ${game.color}`}>
                      <game.icon className="w-5 h-5" />
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {game.tag}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{game.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {game.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center">
                    Играть <RocketIcon className="ml-1.5 w-3 h-3" />
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
