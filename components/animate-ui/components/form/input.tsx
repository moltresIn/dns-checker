"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

const fieldClassName =
  "field-shell h-14 rounded-2xl px-4 text-base text-slate-100 outline-none transition duration-200 placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60";

type InputProps = HTMLMotionProps<"input">;

function Input({ className, ...props }: InputProps) {
  return (
    <motion.input className={cn(fieldClassName, className)} {...props} />
  );
}

export { Input, type InputProps };
