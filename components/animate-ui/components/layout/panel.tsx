"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type PanelProps = HTMLMotionProps<"section">;

function Panel({ className, ...props }: PanelProps) {
  return (
    <motion.section
      className={cn("glass-panel rounded-[32px]", className)}
      {...props}
    />
  );
}

function PanelHeader({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={cn("border-b border-white/10 px-6 py-5", className)}
      {...props}
    />
  );
}

function PanelTitle({ className, ...props }: HTMLMotionProps<"h2">) {
  return (
    <motion.h2
      className={cn("text-2xl font-semibold text-slate-50", className)}
      {...props}
    />
  );
}

function PanelDescription({ className, ...props }: HTMLMotionProps<"p">) {
  return (
    <motion.p
      className={cn("text-sm leading-6 text-slate-400", className)}
      {...props}
    />
  );
}

function PanelContent({ className, ...props }: HTMLMotionProps<"div">) {
  return <motion.div className={cn(className)} {...props} />;
}

function PanelMuted({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={cn("panel-muted rounded-[28px]", className)} {...props} />
  );
}

function MetricCard({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={cn("metric-card rounded-2xl", className)} {...props} />
  );
}

export {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelContent,
  PanelMuted,
  MetricCard
};
