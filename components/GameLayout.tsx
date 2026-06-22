"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RiArrowLeftSLine, RiWalletLine } from "react-icons/ri";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface GameLayoutProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  balance: number | null;
  children: React.ReactNode;
  maxWidth?: string;
}

function AnimatedBalance({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value);
  const [pulse, setPulse] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value === prevRef.current) return;
    const diff = value - prevRef.current;
    const steps = 30;
    const stepSize = diff / steps;
    let current = prevRef.current;
    let step = 0;
    setPulse(true);
    const interval = setInterval(() => {
      step++;
      current += stepSize;
      setDisplayed(Math.round(current));
      if (step >= steps) {
        clearInterval(interval);
        setDisplayed(value);
        prevRef.current = value;
        setTimeout(() => setPulse(false), 600);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [value]);

  const isUp = value > prevRef.current || pulse && displayed > (value - Math.abs(value - prevRef.current));

  return (
    <motion.div
      animate={pulse ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex items-center gap-1.5 text-sm font-semibold tabular-nums transition-colors duration-300 ${
        pulse ? (isUp ? "text-emerald-500" : "text-destructive") : "text-muted-foreground"
      }`}
    >
      <RiWalletLine className="w-4 h-4 shrink-0" />
      <span>{displayed.toLocaleString("ru")} МР</span>
    </motion.div>
  );
}

export function GameLayout({
  title,
  description,
  icon,
  balance,
  children,
  maxWidth = "max-w-2xl",
}: GameLayoutProps) {
  return (
    <div className={`${maxWidth} mx-auto space-y-6 px-4 md:px-0`}>
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/games"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <RiArrowLeftSLine className="w-4 h-4" /> К играм
        </Link>
        <AnimatePresence>
          {balance !== null && <AnimatedBalance value={balance} />}
        </AnimatePresence>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {icon} {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
