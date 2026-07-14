"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/[0.04] text-neutral-300",
        sky: "border-neutral-600 bg-neutral-900 text-neutral-200",
        emerald: "border-neutral-500 bg-neutral-800 text-neutral-100",
        success: "bg-neutral-200/15 text-neutral-100 ring-1 ring-neutral-400/20",
        pending: "bg-neutral-500/15 text-neutral-300 ring-1 ring-neutral-500/20",
        failed: "bg-neutral-700/30 text-neutral-400 ring-1 ring-neutral-600/20",
        timeout: "bg-neutral-600/20 text-neutral-400 ring-1 ring-neutral-600/20",
        idle: "bg-neutral-800/40 text-neutral-500 ring-1 ring-neutral-700/20",
        warning: "border-neutral-500/30 text-neutral-300",
        danger: "border-neutral-600/30 bg-neutral-900 text-neutral-400",
        connected: "border-neutral-400/25 bg-neutral-800 text-neutral-100",
        connecting: "border-neutral-500/25 bg-neutral-900 text-neutral-300",
        reconnecting: "border-neutral-600/25 bg-neutral-900 text-neutral-400"
      },
      size: {
        default: "min-w-[92px] px-3 py-1",
        sm: "px-3 py-1.5 text-sm font-medium normal-case tracking-normal",
        lg: "px-3 py-2 text-sm normal-case tracking-normal"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

type BadgeProps = HTMLMotionProps<"span"> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <motion.span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants, type BadgeProps };
