"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/animate-ui/components/buttons/button";
import {
  ChartCircle,
  ChartContainer,
  ChartDefs,
  ChartGradient,
  ChartGroup,
  ChartLine,
  ChartPolyline,
  ChartStop,
  ChartSvg
} from "@/components/animate-ui/components/data/chart";
import { Box } from "@/components/animate-ui/components/layout/box";
import {
  MetricCard,
  Panel,
  PanelContent,
  PanelDescription,
  PanelTitle
} from "@/components/animate-ui/components/layout/panel";
import { Eyebrow, Text } from "@/components/animate-ui/components/typography/text";
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";
import type { DnsTimeline } from "@/lib/types";

type TimelineChartProps = {
  timeline: DnsTimeline | null;
  refreshing: boolean;
  onRefresh: () => void;
  onClear: () => void;
  onExport: () => void;
};

function formatTimestamp(value: number | null) {
  return value ? new Date(value).toLocaleTimeString() : "Not reached";
}

const actionButtonClassName =
  "h-auto rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 shadow-none hover:border-white/20 hover:text-white";

export function TimelineChart({
  timeline,
  refreshing,
  onRefresh,
  onClear,
  onExport
}: TimelineChartProps) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const chartPoints = useMemo(() => {
    if (!timeline || timeline.snapshots.length === 0) {
      return {
        polyline: "",
        coordinates: [] as Array<{ x: number; y: number; timestamp: number; progress: number }>
      };
    }

    const minTime = timeline.snapshots[0]?.timestamp ?? 0;
    const maxTime = timeline.snapshots.at(-1)?.timestamp ?? minTime;
    const timeRange = Math.max(maxTime - minTime, 1);

    const coordinates = timeline.snapshots.map((snapshot, index) => {
      const fallbackX =
        timeline.snapshots.length === 1 ? 100 : (index / (timeline.snapshots.length - 1)) * 100;
      const x =
        maxTime === minTime ? fallbackX : ((snapshot.timestamp - minTime) / timeRange) * 100;
      const y = 100 - snapshot.progress;

      return {
        x,
        y,
        timestamp: snapshot.timestamp,
        progress: snapshot.progress
      };
    });

    return {
      polyline: coordinates
        .map((coordinate) => `${coordinate.x},${coordinate.y}`)
        .join(" "),
      coordinates
    };
  }, [timeline]);

  return (
    <Panel className="p-6 lg:p-8">
      <Box className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PanelContent>
          <Eyebrow>Timeline</Eyebrow>
          <PanelTitle className="mt-2">Propagation progress</PanelTitle>
          <PanelDescription className="mt-2 max-w-2xl">
            X-axis shows time, Y-axis shows the percentage of resolvers that have successfully
            propagated the requested record.
          </PanelDescription>
        </PanelContent>
        <Box className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            hoverScale={1.01}
            tapScale={0.99}
            suppressHydrationWarning
            className={actionButtonClassName}
          >
            {refreshing ? "Refreshing..." : "Refresh Timeline"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onExport}
            hoverScale={1.01}
            tapScale={0.99}
            suppressHydrationWarning
            className={actionButtonClassName}
          >
            Export JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClear}
            hoverScale={1.01}
            tapScale={0.99}
            suppressHydrationWarning
            className={`${actionButtonClassName} border-rose-400/20 text-rose-200 hover:border-rose-300/40 hover:text-white`}
          >
            Clear History
          </Button>
        </Box>
      </Box>

      <Box className="mt-6 grid gap-4 lg:grid-cols-3">
        <MetricCard className="border border-white/10 bg-white/[0.03] p-4">
          <Text as="span" className="text-xs uppercase tracking-[0.24em] text-neutral-400">
            First Success
          </Text>
          <Text className="mt-3 text-lg font-semibold text-white" suppressHydrationWarning>
            {hydrated ? formatTimestamp(timeline?.firstSuccessAt ?? null) : "Not reached"}
          </Text>
        </MetricCard>
        <MetricCard className="border border-neutral-700 bg-neutral-900/50 p-4">
          <Text as="span" className="text-xs uppercase tracking-[0.24em] text-neutral-300">
            Full Propagation
          </Text>
          <Text className="mt-3 text-lg font-semibold text-white" suppressHydrationWarning>
            {hydrated ? formatTimestamp(timeline?.fullPropagationAt ?? null) : "Not reached"}
          </Text>
        </MetricCard>
        <MetricCard className="border border-white/10 bg-white/[0.03] p-4">
          <Text as="span" className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Latest Progress
          </Text>
          <Text className="mt-3 flex items-center gap-1 text-lg font-semibold text-white">
            {hydrated ? (
              <>
                <SlidingNumber number={timeline?.snapshots.at(-1)?.progress ?? 0} />%
              </>
            ) : (
              <Text as="span">{timeline?.snapshots.at(-1)?.progress ?? 0}%</Text>
            )}
          </Text>
        </MetricCard>
      </Box>

      <MetricCard className="mt-6 border border-white/10 bg-white/[0.03] p-4">
        {timeline && timeline.snapshots.length > 0 ? (
          <ChartContainer className="space-y-4">
            <Box className="flex justify-between text-xs uppercase tracking-[0.24em] text-slate-500">
              <Text as="span">0%</Text>
              <Text as="span">Propagation over time</Text>
              <Text as="span">100%</Text>
            </Box>
            <ChartSvg viewBox="0 0 100 100" className="h-56 w-full overflow-visible">
              <ChartDefs>
                <ChartGradient id="timelineStroke" x1="0%" x2="100%" y1="0%" y2="0%">
                  <ChartStop offset="0%" stopColor="#a3a3a3" />
                  <ChartStop offset="100%" stopColor="#fafafa" />
                </ChartGradient>
              </ChartDefs>
              <ChartGroup>
                {Array.from({ length: 5 }).map((_, index) => {
                  const y = index * 25;
                  return (
                    <ChartLine
                      key={index}
                      x1="0"
                      y1={y}
                      x2="100"
                      y2={y}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="0.5"
                    />
                  );
                })}
              </ChartGroup>
              <ChartPolyline
                fill="none"
                stroke="url(#timelineStroke)"
                strokeWidth="2.2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={chartPoints.polyline}
              />
              {chartPoints.coordinates.map((snapshot, index) => (
                <ChartCircle
                  key={`${snapshot.timestamp}-${index}`}
                  cx={snapshot.x}
                  cy={snapshot.y}
                  r="1.7"
                  fill={snapshot.progress === 100 ? "#fafafa" : "#a3a3a3"}
                />
              ))}
            </ChartSvg>
            <Box className="flex justify-between text-xs text-slate-500">
              <Text as="span" suppressHydrationWarning>
                {hydrated ? formatTimestamp(timeline.snapshots[0]?.timestamp ?? null) : "Not reached"}
              </Text>
              <Text as="span" suppressHydrationWarning>
                {hydrated
                  ? formatTimestamp(timeline.snapshots.at(-1)?.timestamp ?? null)
                  : "Not reached"}
              </Text>
            </Box>
          </ChartContainer>
        ) : (
          <Box className="flex min-h-[224px] items-center justify-center text-sm text-slate-400">
            Run a live check to start collecting propagation history.
          </Box>
        )}
      </MetricCard>
    </Panel>
  );
}
