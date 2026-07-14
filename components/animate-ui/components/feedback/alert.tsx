"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("rounded-2xl border px-4 py-3 text-sm", {
  variants: {
    variant: {
      error: "border-rose-400/20 bg-rose-400/[0.06] text-rose-200",
      info: "border-neutral-600/30 bg-neutral-900 text-neutral-300",
      muted: "border-white/10 bg-white/[0.03] text-slate-400"
    }
  },
  defaultVariants: {
    variant: "error"
  }
});

type AlertProps = HTMLMotionProps<"div"> & VariantProps<typeof alertVariants>;

function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <motion.div
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Alert, type AlertProps };
