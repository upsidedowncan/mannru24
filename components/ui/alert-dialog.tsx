"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root {...props} />;
}

function AlertDialogTrigger({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return <AlertDialogPrimitive.Trigger {...props} />;
}

function AlertDialogPortal({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return <AlertDialogPrimitive.Portal {...props} />;
}

function AlertDialogOverlay({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay asChild>
      <motion.div
        className={cn("fixed inset-0 z-50 bg-black/60 backdrop-blur-sm", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      />
    </AlertDialogPrimitive.Overlay>
  );
}

function AlertDialogContent({ className, children, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <AlertDialogPrimitive.Content
          className={cn("relative w-full max-w-lg border bg-background p-6 shadow-2xl sm:rounded-xl", className)}
          {...props}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30, rotateX: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30, rotateX: -6 }}
            transition={{ type: "spring", damping: 28, stiffness: 400, mass: 0.7 }}
            style={{ transformOrigin: "center center" }}
          >
            {children}
          </motion.div>
        </AlertDialogPrimitive.Content>
      </div>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />;
}

function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />;
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return <AlertDialogPrimitive.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return <AlertDialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function AlertDialogAction({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return <AlertDialogPrimitive.Action className={cn(buttonVariants({ variant: "destructive" }), className)} {...props} />;
}

function AlertDialogCancel({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)} {...props} />;
}

export { AlertDialog, AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel };
