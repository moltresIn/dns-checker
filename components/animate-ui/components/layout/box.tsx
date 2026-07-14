"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type BoxProps = HTMLMotionProps<"div">;

function Box({ className, ...props }: BoxProps) {
  return <motion.div className={cn(className)} {...props} />;
}

type MainProps = HTMLMotionProps<"main">;

function Main({ className, ...props }: MainProps) {
  return <motion.main className={cn(className)} {...props} />;
}

export { Box, Main, type BoxProps, type MainProps };
