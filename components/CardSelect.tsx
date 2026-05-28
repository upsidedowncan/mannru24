"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tierMeta } from "@/components/BankCard";
import type { Card } from "@/lib/db";

interface CardSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function CardSelect({ value, onValueChange, className, placeholder = "Выберите карту" }: CardSelectProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cards")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCards(data);
          // Auto-select first card if value is empty
          if (!value && data.length > 0) {
            onValueChange(data[0].id);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectedCard = cards.find((c) => c.id === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={loading}>
      <SelectTrigger className={className}>
        {selectedCard ? (
          <div className="flex items-center gap-2">
            <div className={`w-4 h-2.5 rounded-sm ${tierMeta[selectedCard.tier].gradient} ring-1 ring-white/10`} />
            <span className="truncate">
              {tierMeta[selectedCard.tier].label} ••{selectedCard.number.slice(-4)}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">{loading ? "Загрузка..." : placeholder}</span>
        )}
      </SelectTrigger>
      <SelectContent className="bg-zinc-950 border-zinc-800">
        {cards.map((card) => (
          <SelectItem key={card.id} value={card.id} className="focus:bg-zinc-900 focus:text-white cursor-pointer">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-2.5 rounded-sm ${tierMeta[card.tier].gradient} ring-1 ring-white/10`} />
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium">
                  {tierMeta[card.tier].label} ••{card.number.slice(-4)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {card.balance.toLocaleString("ru")} МР
                </span>
              </div>
            </div>
          </SelectItem>
        ))}
        {cards.length === 0 && !loading && (
          <div className="p-2 text-center text-xs text-muted-foreground">
            Нет доступных карт
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
