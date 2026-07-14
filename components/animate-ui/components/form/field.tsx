"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import { LabelText } from "@/components/animate-ui/components/typography/text";

function Field({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={cn("flex flex-col gap-3", className)} {...props} />
  );
}

type FieldLabelProps = HTMLMotionProps<"label"> & {
  uppercase?: boolean;
};

function FieldLabel({ className, uppercase = false, ...props }: FieldLabelProps) {
  return (
    <motion.label
      className={cn(
        uppercase && "text-sm font-medium uppercase tracking-[0.24em] text-slate-400",
        className
      )}
      {...props}
    />
  );
}

function FieldCaption({ className, ...props }: HTMLMotionProps<"span">) {
  return <LabelText className={cn(className)} {...props} />;
}

function FieldHint({ className, ...props }: HTMLMotionProps<"p">) {
  return (
    <motion.p className={cn("text-sm text-slate-400", className)} {...props} />
  );
}

export { Field, FieldLabel, FieldCaption, FieldHint };
