"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RocketIcon, TargetIcon, DiscIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";

const games = [
  {
    id: "slots",
    title: "Слоты «Три Топора»",
    description: "Испытай удачу в нашем абсолютно честном* игровом автомате.",
    icon: DiscIcon,
    color: "from-amber-500 to-orange-600",
    href: "/dashboard/games/slots",
    tag: "Популярно",
  },
  {
    id: "roulette",
    title: "Русская Рулетка",
    description: "Ставки высоки, как никогда. Выживи и удвой свой капитал.",
    icon: TargetIcon,
    color: "from-red-600 to-rose-900",
    href: "/dashboard/games/roulette",
    tag: "Hardcore",
  },
];

export default function GamesPage() {
  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Развлечения</h1>
        <p className="text-muted-foreground mt-2">
          Потому что серьезный бизнес — это скучно. Тратьте свои МР с удовольствием.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={game.href}>
              <Card className="group relative overflow-hidden h-full border-zinc-800 bg-zinc-950 hover:border-zinc-700 transition-all">
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                <CardHeader className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${game.color} shadow-lg`}>
                      <game.icon className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="bg-zinc-900 text-zinc-400 border-zinc-800">
                      {game.tag}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4 text-2xl group-hover:text-white transition-colors">{game.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed mt-2">
                    {game.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-center text-xs font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    Играть сейчас <RocketIcon className="ml-2 w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <Card className="bg-zinc-900/50 border-dashed border-zinc-800">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4 text-zinc-500">
            ?
          </div>
          <h3 className="font-medium text-zinc-300">Новые игры в разработке</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-[280px]">
            Наши инженеры работают над BlackJack и другими способами обнулить ваш баланс.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
