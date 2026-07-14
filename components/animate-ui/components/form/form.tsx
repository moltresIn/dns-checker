"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type FormProps = HTMLMotionProps<"form">;

function Form({ className, ...props }: FormProps) {
  return <motion.form className={cn(className)} {...props} />;
}

export { Form, type FormProps };
