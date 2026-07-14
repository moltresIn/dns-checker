"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type TextProps = HTMLMotionProps<"p"> & {
  as?: "p" | "span";
};

function Text({ as = "p", className, ...props }: TextProps) {
  const Component = motion[as];
  return <Component className={cn(className)} {...props} />;
}

function Eyebrow({ className, ...props }: HTMLMotionProps<"p">) {
  return (
    <motion.p
      className={cn("section-eyebrow", className)}
      {...props}
    />
  );
}

type HeadingProps = HTMLMotionProps<"h1"> & {
  level?: 1 | 2 | 3;
};

function Heading({ level = 1, className, ...props }: HeadingProps) {
  const tag = `h${level}` as "h1" | "h2" | "h3";
  const Component = motion[tag];
  const sizeClass =
    level === 1
      ? "text-4xl font-semibold tracking-tight text-white sm:text-5xl"
      : level === 2
        ? "text-2xl font-semibold text-slate-50"
        : "text-xl font-semibold text-white";

  return <Component className={cn(sizeClass, className)} {...props} />;
}

function LabelText({ className, ...props }: HTMLMotionProps<"span">) {
  return (
    <motion.span
      className={cn("text-sm font-medium text-slate-400", className)}
      {...props}
    />
  );
}

function MonoText({ className, ...props }: HTMLMotionProps<"span">) {
  return (
    <motion.span
      className={cn("font-mono text-xs text-slate-500", className)}
      {...props}
    />
  );
}

export { Text, Eyebrow, Heading, LabelText, MonoText };
