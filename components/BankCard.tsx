import { Wifi } from "lucide-react";
import type { CardTier } from "@/lib/db";

interface BankCardProps {
  tier: CardTier;
  number: string;
  holder: string;
  balance: number;
  expiry: string;
  emojiCode?: string | null;
}

export const tierMeta: Record<CardTier, { label: string; gradient: string; textColor: string; subtext: string; ring: string; accent: string; price: string; cashback: string }> = {
  bronze: { label: "Bronze", gradient: "bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900", textColor: "text-amber-50", subtext: "text-amber-300/70", ring: "ring-amber-700/40", accent: "text-amber-400", price: "Бесплатно", cashback: "0.5%" },
  silver: { label: "Silver", gradient: "bg-gradient-to-br from-zinc-300 via-zinc-100 to-zinc-400", textColor: "text-zinc-900", subtext: "text-zinc-600", ring: "ring-zinc-400/30", accent: "text-zinc-500", price: "Бесплатно", cashback: "1%" },
  gold: { label: "Gold", gradient: "bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-400", textColor: "text-amber-950", subtext: "text-amber-700", ring: "ring-amber-400/30", accent: "text-amber-600", price: "299 МР/мес", cashback: "3%" },
  platinum: { label: "Platinum", gradient: "bg-gradient-to-br from-slate-200 via-zinc-100 to-slate-300", textColor: "text-slate-900", subtext: "text-slate-600", ring: "ring-slate-400/30", accent: "text-slate-500", price: "599 МР/мес", cashback: "5%" },
  titanium: { label: "Titanium", gradient: "bg-gradient-to-br from-zinc-500 via-zinc-400 to-zinc-600", textColor: "text-white", subtext: "text-zinc-300", ring: "ring-zinc-500/30", accent: "text-zinc-300", price: "899 МР/мес", cashback: "6%" },
  ruby: { label: "Ruby", gradient: "bg-gradient-to-br from-red-500 via-rose-400 to-red-600", textColor: "text-white", subtext: "text-red-200", ring: "ring-red-500/30", accent: "text-rose-300", price: "1 199 МР/мес", cashback: "7%" },
  emerald: { label: "Emerald", gradient: "bg-gradient-to-br from-emerald-500 via-green-400 to-emerald-600", textColor: "text-white", subtext: "text-emerald-200", ring: "ring-emerald-500/30", accent: "text-green-300", price: "1 499 МР/мес", cashback: "8%" },
  sapphire: { label: "Sapphire", gradient: "bg-gradient-to-br from-blue-500 via-sky-400 to-blue-600", textColor: "text-white", subtext: "text-blue-200", ring: "ring-blue-500/30", accent: "text-sky-300", price: "1 999 МР/мес", cashback: "9%" },
  diamond: { label: "Diamond", gradient: "bg-gradient-to-br from-cyan-300 via-sky-200 to-cyan-400", textColor: "text-sky-950", subtext: "text-sky-700", ring: "ring-cyan-400/30", accent: "text-cyan-600", price: "2 999 МР/мес", cashback: "10%" },
  black: { label: "Black", gradient: "bg-gradient-to-br from-zinc-800 via-zinc-900 to-black", textColor: "text-white", subtext: "text-zinc-400", ring: "ring-zinc-600/30", accent: "text-zinc-300", price: "4 999 МР/мес", cashback: "12%" },
  obsidian: { label: "Obsidian", gradient: "bg-gradient-to-br from-violet-900 via-purple-950 to-black", textColor: "text-white", subtext: "text-violet-300", ring: "ring-violet-700/30", accent: "text-violet-400", price: "9 999 МР/мес", cashback: "15%" },
};

export function BankCard({ tier, number, holder, balance, expiry, emojiCode }: BankCardProps) {
  const style = tierMeta[tier];

  return (
    <div className={`relative overflow-hidden rounded-xl p-5 w-[300px] aspect-[1.586/1] flex flex-col justify-between ${style.gradient} ring-1 ${style.ring} shadow-xl`}>
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border opacity-20" />
      <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full border opacity-10" />

      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className={`${style.subtext} text-xs font-medium`}>Маннру</p>
          <p className={`${style.textColor} font-semibold text-sm mt-0.5`}>{style.label}</p>
        </div>
        {emojiCode && (
          <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="text-lg">{emojiCode}</span>
          </div>
        )}
        {!emojiCode && <Wifi className={`w-5 h-5 ${style.subtext} rotate-90`} />}
      </div>

      <div className="relative z-10">
        <p className={`${style.textColor} font-mono text-base tracking-[0.2em]`}>{number}</p>
      </div>

      <div className="relative z-10 flex justify-between items-end">
        <div>
          <p className={`${style.subtext} text-[10px] uppercase tracking-wider`}>Держатель</p>
          <p className={`${style.textColor} font-medium text-xs`}>{holder}</p>
        </div>
        <div className="text-right">
          <p className={`${style.subtext} text-[10px] uppercase tracking-wider`}>Баланс</p>
          <p className={`${style.textColor} font-semibold text-base`}>{balance.toLocaleString("ru")} МР</p>
        </div>
        <div>
          <p className={`${style.subtext} text-[10px] uppercase tracking-wider`}>Срок</p>
          <p className={`${style.textColor} font-medium text-xs`}>{expiry}</p>
        </div>
      </div>
    </div>
  );
}
