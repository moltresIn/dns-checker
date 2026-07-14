"use client";

import { Button } from "@/components/animate-ui/components/buttons/button";
import { Box } from "@/components/animate-ui/components/layout/box";
import {
  MetricCard,
  PanelContent
} from "@/components/animate-ui/components/layout/panel";
import { Text } from "@/components/animate-ui/components/typography/text";
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";
import { StatusBadge } from "@/components/StatusBadge";
import type { DomainViewState } from "@/lib/domainState";
import { cn } from "@/lib/utils";

type DomainSummaryCardProps = {
  domain: string;
  state: DomainViewState;
  isActive: boolean;
  jobRunning: boolean;
  hydrated: boolean;
  onClick: (domain: string) => void;
};

export function DomainSummaryCard({
  domain,
  state,
  isActive,
  jobRunning,
  hydrated,
  onClick
}: DomainSummaryCardProps) {
  return (
    <Button
      type="button"
      onClick={() => onClick(domain)}
      suppressHydrationWarning
      hoverScale={1.01}
      tapScale={0.99}
      className={cn(
        "h-auto w-full justify-start rounded-[26px] border p-5 text-left shadow-[0_18px_45px_rgba(0,0,0,0.16)] transition-colors",
        isActive
          ? "border-neutral-400/40 bg-neutral-400/[0.08] ring-1 ring-neutral-400/20"
          : "border-white/10 bg-white/[0.03] hover:border-white/20"
      )}
    >
      <Box className="flex w-full items-start justify-between gap-3">
        <PanelContent>
          <Text className="text-lg font-semibold text-white">{domain}</Text>
          <Text as="span" className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            {hydrated ? (
              <>
                <SlidingNumber number={state.summary.propagationPercent} />
                <Text as="span" className="inline">% propagated</Text>
              </>
            ) : (
              <Text as="span" className="inline">
                {state.summary.propagationPercent}% propagated
              </Text>
            )}
          </Text>
        </PanelContent>
        <StatusBadge
          status={
            state.summary.status === "complete"
              ? "success"
              : state.summary.status === "failed"
                ? "failed"
                : jobRunning
                  ? "pending"
                  : "idle"
          }
        />
      </Box>

      <Box className="mt-4 grid w-full grid-cols-3 gap-3 text-sm text-slate-300">
        <MetricCard className="border border-white/10 bg-black/40 p-3">
          <Text as="span" className="text-xs text-slate-500">Rate</Text>
          <Box className="mt-2 font-semibold text-white">
            {hydrated ? (
              <SlidingNumber number={state.summary.successRate} />
            ) : (
              `${state.summary.successRate}`
            )}
            %
          </Box>
        </MetricCard>
        <MetricCard className="border border-white/10 bg-black/40 p-3">
          <Text as="span" className="text-xs text-slate-500">Fastest</Text>
          <Box className="mt-2 truncate font-semibold text-white">
            {state.summary.fastestResolver ?? "-"}
          </Box>
        </MetricCard>
        <MetricCard className="border border-white/10 bg-black/40 p-3">
          <Text as="span" className="text-xs text-slate-500">Updates</Text>
          <Box
            className="mt-2 font-semibold text-white"
            suppressHydrationWarning
          >
            {hydrated && state.checkedAt
              ? new Date(state.checkedAt).toLocaleTimeString()
              : "-"}
          </Box>
        </MetricCard>
      </Box>
    </Button>
  );
}
