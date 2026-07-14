"use client";

import { useState } from "react";
import { Button } from "@/components/animate-ui/components/buttons/button";
import { cn } from "@/lib/utils";

type CopyButtonProps = {
  value: string;
  label?: string;
  className?: string;
};

export function CopyButton({
  value,
  label = "Copy",
  className
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      hoverScale={1.02}
      tapScale={0.98}
      onClick={handleCopy}
      className={cn(
        "h-7 rounded-lg border-white/10 bg-transparent px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400 shadow-none hover:border-white/20 hover:text-white",
        className
      )}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}
