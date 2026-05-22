"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Lock } from "lucide-react";

export default function InvestmentsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
      <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <TrendingUp className="w-10 h-10 text-blue-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter text-white uppercase">Инвестиционный Портал</h1>
        <p className="text-zinc-500 max-w-md">
          Здесь вы сможете приумножить свои воображаемые капиталы, если, конечно, обладаете достаточным уровнем цинизма.
        </p>
      </div>

      <Card className="bg-zinc-950 border-zinc-900 border-dashed max-w-sm w-full">
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/5 px-3 py-1">
            <Lock className="w-3 h-3 mr-1.5" /> Требуется 15 уровень
          </Badge>
          <p className="text-xs text-zinc-600 italic">
            "Инвестиции — это способ перераспределения денег от нетерпеливых к терпеливым... или просто к нам."
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
