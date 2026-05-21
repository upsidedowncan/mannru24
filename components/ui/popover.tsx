"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger {...props} />;
}

function PopoverContent({ className, align = "center", sideOffset = 4, ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content asChild align={align} sideOffset={sideOffset} className={cn("z-50 w-72 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg outline-none", className)} {...props}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -6 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {props.children}
        </motion.div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
