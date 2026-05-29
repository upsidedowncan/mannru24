"use client";

import { useEffect, useState } from "react";
import { RiHistoryLine } from "react-icons/ri";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserProfile } from "@/lib/db";

export function SystemLogs() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch("/api/user").then(res => res.json()).then(setUser);
  }, []);

  if (!user) return null;

  return (
    <Card className="h-full border-zinc-900 bg-zinc-950/50">
      <CardHeader className="pb-3 border-b border-zinc-900">
        <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-zinc-400">
          <RiHistoryLine className="w-3.5 h-3.5" /> SYSTEM LOGS
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 px-0">
        <div className="space-y-4 px-4 font-mono text-[10px] leading-relaxed overflow-hidden h-[300px]">
          {(user.clickHistory || []).slice(-10).reverse().map((log, i) => (
            <div key={i} className="flex gap-3 text-zinc-500 hover:text-zinc-300 transition-colors">
              <span className="text-zinc-700 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
              <span className="text-zinc-400">SYS_AUTH_TRC:</span>
              <span>{log.action}</span>
            </div>
          ))}
          <div className="animate-pulse text-blue-500/50">_ WAITING FOR NEXT INPUT...</div>
        </div>
      </CardContent>
    </Card>
  );
}
