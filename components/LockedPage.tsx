"use client";

import { LockClosedIcon, ChevronRightIcon, MagicWandIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface LockedPageProps {
  title: string;
  description: string;
  requiredLevel: number;
  currentLevel: number;
}

export function LockedPage({ title, description, requiredLevel, currentLevel }: LockedPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="mb-8 p-6 rounded-full bg-secondary/50 border border-border">
        <LockClosedIcon className="w-12 h-12 text-muted-foreground" />
      </div>

      <h1 className="text-3xl font-bold mb-3 tracking-tight">{title}</h1>
      <p className="text-muted-foreground max-w-md mb-8 text-lg">
        {description}
      </p>

      <Card className="w-full max-w-sm mb-8 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Требование доступа
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Ваш уровень:</span>
            <span className="font-bold text-red-500">{currentLevel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Необходимый уровень:</span>
            <span className="font-bold text-blue-500">{requiredLevel}</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (currentLevel / requiredLevel) * 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <Button asChild className="flex-1 shadow-[0_4px_12px_rgba(59,130,246,0.3)]" variant="gradient">
          <Link href="/dashboard/tasks">
            Набрать опыт <MagicWandIcon className="ml-2 w-4 h-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/dashboard">
            На главную <ChevronRightIcon className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
