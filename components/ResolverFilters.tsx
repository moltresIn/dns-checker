"use client";

import { Button } from "@/components/animate-ui/components/buttons/button";
import { Box } from "@/components/animate-ui/components/layout/box";
import {
  MetricCard,
  Panel,
  PanelContent,
  PanelDescription,
  PanelTitle
} from "@/components/animate-ui/components/layout/panel";
import { Input } from "@/components/animate-ui/components/form/input";
import { Field, FieldLabel } from "@/components/animate-ui/components/form/field";
import { Eyebrow, Text } from "@/components/animate-ui/components/typography/text";
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";
import type { ResolverFilterOptions, ResolverFilters } from "@/lib/types";
import { cn } from "@/lib/utils";

type FilterGroupKey = "providers" | "regions" | "countries";

type ResolverFiltersProps = {
  filters: ResolverFilters;
  options: ResolverFilterOptions;
  matchedCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onSelectionChange: (key: FilterGroupKey, values: string[]) => void;
  onResetFilters: () => void;
};

type FilterGroupProps = {
  label: string;
  filterKey: FilterGroupKey;
  options: string[];
  selected: string[];
  onSelectionChange: (key: FilterGroupKey, values: string[]) => void;
};

const chipButtonClassName =
  "rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-neutral-400 transition hover:border-neutral-500 hover:text-white";

function FilterGroup({
  label,
  filterKey,
  options,
  selected,
  onSelectionChange
}: FilterGroupProps) {
  return (
    <Box className="panel-muted rounded-[24px] p-4">
      <Box className="flex flex-wrap items-center justify-between gap-3">
        <PanelContent>
          <Text className="text-sm font-medium text-white">{label}</Text>
          <Text className="mt-1 text-xs text-slate-500">{selected.length} selected</Text>
        </PanelContent>
        <Box className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSelectionChange(filterKey, options)}
            hoverScale={1.02}
            tapScale={0.98}
            suppressHydrationWarning
            className={chipButtonClassName}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onSelectionChange(filterKey, [])}
            hoverScale={1.02}
            tapScale={0.98}
            suppressHydrationWarning
            className={cn(chipButtonClassName, "hover:border-rose-300/30")}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      <Box className="subtle-scrollbar mt-4 flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
        {options.map((option) => {
          const isSelected = selected.includes(option);

          return (
            <Box
              key={option}
              role="button"
              tabIndex={0}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
                isSelected
                  ? "border-neutral-400/40 bg-neutral-400/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:text-white"
              )}
              onClick={() =>
                onSelectionChange(
                  filterKey,
                  isSelected
                    ? selected.filter((item) => item !== option)
                    : [...selected, option]
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectionChange(
                    filterKey,
                    isSelected
                      ? selected.filter((item) => item !== option)
                      : [...selected, option]
                  );
                }
              }}
            >
              <Box
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition",
                  isSelected ? "bg-neutral-300" : "bg-neutral-600"
                )}
              />
              {option}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export function ResolverFilters({
  filters,
  options,
  matchedCount,
  totalCount,
  onSearchChange,
  onSelectionChange,
  onResetFilters
}: ResolverFiltersProps) {
  return (
    <Panel className="p-6 lg:p-8">
      <Box className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PanelContent>
          <Eyebrow>Resolver filters</Eyebrow>
          <PanelTitle className="mt-2">Narrow the resolver set</PanelTitle>
          <PanelDescription className="mt-2 max-w-2xl">
            Filter by provider, region, country, or search terms. The table and
            globe update from the same filter state, so both views stay aligned.
          </PanelDescription>
        </PanelContent>
        <Box className="flex items-center gap-3">
          <MetricCard className="px-4 py-3 text-sm text-slate-300">
            Showing <SlidingNumber number={matchedCount} className="font-semibold text-white" /> of{" "}
            <SlidingNumber number={totalCount} className="font-semibold text-white" /> resolvers
          </MetricCard>
          <Button
            type="button"
            variant="outline"
            onClick={onResetFilters}
            hoverScale={1.01}
            tapScale={0.99}
            suppressHydrationWarning
            className="h-auto rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 shadow-none hover:border-white/20 hover:text-white"
          >
            Reset Filters
          </Button>
        </Box>
      </Box>

      <Box className="mt-6">
        <Field>
          <FieldLabel>Search</FieldLabel>
          <Input
            type="search"
            value={filters.search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by resolver, provider, country, region, city, or server"
            suppressHydrationWarning
          />
        </Field>
      </Box>

      <Box className="mt-6 grid gap-4 xl:grid-cols-3">
        <FilterGroup
          label="Provider"
          filterKey="providers"
          options={options.providers}
          selected={filters.providers}
          onSelectionChange={onSelectionChange}
        />
        <FilterGroup
          label="Region"
          filterKey="regions"
          options={options.regions}
          selected={filters.regions}
          onSelectionChange={onSelectionChange}
        />
        <FilterGroup
          label="Country"
          filterKey="countries"
          options={options.countries}
          selected={filters.countries}
          onSelectionChange={onSelectionChange}
        />
      </Box>
    </Panel>
  );
}
