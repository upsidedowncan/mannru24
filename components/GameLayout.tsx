"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RiArrowLeftSLine } from "react-icons/ri";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ReactNode } from "react";

interface GameLayoutProps {
  /** Icon component from react-icons */
  icon: ReactNode;
  title: string;
  description: string;
  /** Current balance to display in the header badge — pass null to hide */
  balance: number | null;
  /** Back link destination, defaults to /dashboard/games */
  backHref?: string;
  /** Back link label, defaults to "К играм" */
  backLabel?: string;
  /** Max width class, defaults to max-w-2xl */
  maxWidth?: string;
  children: ReactNode;
}

export function GameLayout({
  icon,
  title,
  description,
  balance,
  backHref = "/dashboard/games",
  backLabel = "К играм",
  maxWidth = "max-w-2xl",
  children,
}: GameLayoutProps) {
  return (
    <div className={`${maxWidth} mx-auto space-y-5 px-4 md:px-0`}>
      {/* Back navigation */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pt-1"
      >
        <RiArrowLeftSLine className="w-4 h-4" />
        {backLabel}
      </Link>

      <Card>
        <CardHeader className="text-center pb-4">
          {/* Title row */}
          <CardTitle className="flex items-center justify-center gap-2 text-lg">
            <span className="text-muted-foreground">{icon}</span>
            {title}
          </CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>

          {/* Live balance badge */}
          <AnimatePresence>
            {balance !== null && (
              <motion.div
                key={balance}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.25 }}
                className="mt-3 flex justify-center"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {balance.toLocaleString("ru")} МР
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>

        <CardContent className="pb-10">{children}</CardContent>
      </Card>
    </div>
  );
}
