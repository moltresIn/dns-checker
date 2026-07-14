"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

function Table({ className, ...props }: HTMLMotionProps<"table">) {
  return (
    <motion.table
      className={cn(
        "min-w-full border-separate border-spacing-0 text-left",
        className
      )}
      {...props}
    />
  );
}

function TableHeader({ className, ...props }: HTMLMotionProps<"thead">) {
  return (
    <motion.thead
      className={cn(
        "sticky top-0 z-10 bg-black/80 backdrop-blur",
        className
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: HTMLMotionProps<"tbody">) {
  return (
    <motion.tbody className={cn("text-sm text-slate-200", className)} {...props} />
  );
}

function TableRow({ className, ...props }: HTMLMotionProps<"tr">) {
  return <motion.tr className={cn(className)} {...props} />;
}

function TableHead({ className, ...props }: HTMLMotionProps<"th">) {
  return (
    <motion.th
      className={cn(
        "px-4 py-4 text-xs font-medium uppercase tracking-[0.24em] text-slate-500",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: HTMLMotionProps<"td">) {
  return (
    <motion.td className={cn("px-4 py-4 align-top", className)} {...props} />
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
