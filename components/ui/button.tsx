"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-zinc-50 to-zinc-100 text-zinc-900 shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset,0_2px_4px_0_rgba(0,0,0,0.4)] hover:from-zinc-100 hover:to-zinc-200 border border-zinc-800 active:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_0px_2px_0_rgba(0,0,0,0.3)] active:translate-y-[1px]",
        destructive:
          "bg-gradient-to-b from-red-600 to-red-700 text-white shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_2px_4px_0_rgba(0,0,0,0.4)] hover:from-red-500 hover:to-red-600 border border-red-800 active:shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_0px_2px_0_rgba(0,0,0,0.3)] active:translate-y-[1px]",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        secondary:
          "bg-gradient-to-b from-zinc-700 to-zinc-800 text-zinc-100 shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_2px_4px_0_rgba(0,0,0,0.3)] hover:from-zinc-600 hover:to-zinc-700 border border-zinc-700 active:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_0px_2px_0_rgba(0,0,0,0.2)] active:translate-y-[1px]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_2px_8px_0_rgba(59,130,246,0.35)] hover:from-blue-400 hover:to-blue-500 border border-blue-400/30 active:shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_1px_4px_0_rgba(59,130,246,0.2)] active:translate-y-[1px]",
        emerald:
          "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_2px_8px_0_rgba(16,185,129,0.35)] hover:from-emerald-400 hover:to-emerald-500 border border-emerald-400/30 active:shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_1px_4px_0_rgba(16,185,129,0.2)] active:translate-y-[1px]",
        amber:
          "bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_2px_8px_0_rgba(245,158,11,0.35)] hover:from-amber-400 hover:to-amber-500 border border-amber-400/30 active:shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_1px_4px_0_rgba(245,158,11,0.2)] active:translate-y-[1px]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? "span" : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
