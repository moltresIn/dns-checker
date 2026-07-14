"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type TextareaProps = HTMLMotionProps<"textarea">;

function Textarea({ className, ...props }: TextareaProps) {
  return (
    <motion.textarea
      className={cn(
        "field-shell min-h-[170px] rounded-[28px] px-5 py-4 text-base text-slate-100 outline-none transition duration-200 placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export { Textarea, type TextareaProps };
