"use client";

import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";
import { Badge } from "@/components/animate-ui/components/display/badge";
import { Box } from "@/components/animate-ui/components/layout/box";
import {
  MetricCard,
  Panel,
  PanelContent,
  PanelMuted
} from "@/components/animate-ui/components/layout/panel";
import { Eyebrow, Heading, Text } from "@/components/animate-ui/components/typography/text";
import type { DnsBulkResponse } from "@/lib/types";
import type { SocketConnectionState } from "@/hooks/useSocket";

type HeroPanelProps = {
  domainCount: number;
  totalSuccessCount: number;
  socketState: SocketConnectionState;
  jobMeta: DnsBulkResponse | null;
  hydrated: boolean;
};

function getConnectionMeta(socketState: SocketConnectionState) {
  switch (socketState) {
    case "ready":
      return { label: "Connected", variant: "connected" as const };
    case "connecting":
      return { label: "Connecting…", variant: "connecting" as const };
    case "closed":
      return { label: "Reconnecting…", variant: "reconnecting" as const };
  }
}

export function HeroPanel({
  domainCount,
  totalSuccessCount,
  socketState,
  jobMeta,
  hydrated
}: HeroPanelProps) {
  const connection = getConnectionMeta(socketState);

  return (
    <Panel className="overflow-hidden rounded-[32px]">
      <Box className="grid gap-10 px-6 py-8 lg:grid-cols-[1.25fr_0.75fr] lg:px-8 lg:py-10">
        <PanelContent>
          <Eyebrow className="text-sm uppercase tracking-[0.36em] text-neutral-400">
            DNS Lens Live
          </Eyebrow>
          <Heading
            level={1}
            className="mt-4 max-w-3xl text-balance"
          >
            Bulk DNS propagation checks with live streaming and timeline
            tracking.
          </Heading>
          <Text className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Stream resolver updates row by row, inspect propagation history over
            time, and run multiple domains in parallel without waiting for the
            entire batch to finish.
          </Text>
          <Box className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.24em] text-slate-300">
            <Badge variant="sky" size="lg" className="py-2 border-neutral-700 bg-neutral-900 text-neutral-200">
              WebSocket live streaming
            </Badge>
            <Badge variant="emerald" size="lg" className="py-2 border-neutral-600 bg-neutral-800 text-neutral-100">
              Bulk domain batches
            </Badge>
            <Badge size="lg" className="py-2">
              Timeline history in memory
            </Badge>
          </Box>
        </PanelContent>

        <PanelMuted className="p-5">
          <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3">
            <MetricCard className="min-w-0 p-4">
              <Text
                as="span"
                className="text-xs uppercase tracking-[0.24em] text-neutral-400"
              >
                Domains
              </Text>
              <Box className="mt-3 text-3xl font-semibold text-white">
                {hydrated ? (
                  <SlidingNumber number={domainCount} />
                ) : (
                  domainCount
                )}
              </Box>
            </MetricCard>
            <MetricCard className="min-w-0 p-4">
              <Text
                as="span"
                className="text-xs uppercase tracking-[0.24em] text-neutral-300"
              >
                Successes
              </Text>
              <Box className="mt-3 text-3xl font-semibold text-white">
                {hydrated ? (
                  <SlidingNumber number={totalSuccessCount} />
                ) : (
                  totalSuccessCount
                )}
              </Box>
            </MetricCard>
            <MetricCard className="min-w-0 p-4 sm:col-span-2 lg:col-span-1">
              <Text
                as="span"
                className="text-xs uppercase tracking-[0.24em] text-slate-400"
              >
                Live
              </Text>
              <Box className="mt-3">
                <Badge
                  variant={connection.variant}
                  size="sm"
                  className="w-fit max-w-full text-xs font-medium md:text-sm"
                >
                  {connection.label}
                </Badge>
              </Box>
            </MetricCard>
          </Box>

          <MetricCard className="mt-5 p-4 text-sm text-slate-300">
            {jobMeta ? (
              <>
                Job{" "}
                <Text as="span" className="inline font-mono text-white">
                  {jobMeta.jobId.slice(0, 8)}
                </Text>{" "}
                started at{" "}
                <Text
                  as="span"
                  className="inline font-medium text-white"
                  suppressHydrationWarning
                >
                  {hydrated
                    ? new Date(jobMeta.startedAt).toLocaleTimeString()
                    : "--:--:--"}
                </Text>
              </>
            ) : (
              "Paste a domain, run a check, and stream resolver updates in real time."
            )}
          </MetricCard>
        </PanelMuted>
      </Box>
    </Panel>
  );
}
