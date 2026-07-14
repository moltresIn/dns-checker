"use client";

import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/animate-ui/components/buttons/button";
import {
  Menu,
  MenuPanel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger
} from "@/components/animate-ui/components/base/menu";
import { cn } from "@/lib/utils";

export type SelectMenuOption = {
  value: string;
  label: string;
};

type SelectMenuProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectMenuOption[];
  disabled?: boolean;
  className?: string;
  panelClassName?: string;
  "aria-label"?: string;
};

const triggerClassName =
  "field-shell flex h-14 w-full items-center justify-between gap-3 rounded-2xl px-4 text-left text-base font-normal text-neutral-100 shadow-none hover:bg-transparent disabled:cursor-not-allowed disabled:opacity-60";

function SelectMenu({
  value,
  onChange,
  options,
  disabled = false,
  className,
  panelClassName,
  "aria-label": ariaLabel
}: SelectMenuProps) {
  const selected = options.find((option) => option.value === value);

  return (
    <Menu>
      <MenuTrigger
        disabled={disabled}
        aria-label={ariaLabel}
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            hoverScale={1}
            tapScale={0.99}
            className={cn(triggerClassName, className)}
          />
        }
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-neutral-500" />
      </MenuTrigger>

      <MenuPanel
        align="start"
        sideOffset={8}
        className={cn(
          "min-w-[var(--anchor-width)] rounded-2xl border border-white/10 bg-black/95 p-1.5 shadow-2xl backdrop-blur-xl",
          panelClassName
        )}
      >
        <MenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => (
            <MenuRadioItem
              key={option.value}
              value={option.value}
              className="rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:bg-white/10 focus:text-white"
            >
              {option.label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPanel>
    </Menu>
  );
}

export { SelectMenu, type SelectMenuProps };
