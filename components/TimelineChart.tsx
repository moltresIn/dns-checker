"use client";

import { useEffect, useMemo, useState } from "react";
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
        .map((coordinate) => {
          return `${coordinate.x},${coordinate.y}`;
        })
        .join(" "),
      coordinates
    };
  }, [timeline]);

  return (
    <section className="glass-panel rounded-[32px] p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Timeline</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50">Propagation progress</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            X-axis shows time, Y-axis shows the percentage of resolvers that have successfully
            propagated the requested record.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            suppressHydrationWarning
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            {refreshing ? "Refreshing..." : "Refresh Timeline"}
          </button>
          <button
            type="button"
            onClick={onExport}
            suppressHydrationWarning
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={onClear}
            suppressHydrationWarning
            className="rounded-2xl border border-rose-400/20 px-4 py-3 text-sm font-medium text-rose-200 transition hover:border-rose-300/40 hover:text-white"
          >
            Clear History
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[24px] border border-emerald-400/10 bg-emerald-400/[0.05] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">First Success</p>
          <p className="mt-3 text-lg font-semibold text-white" suppressHydrationWarning>
            {hydrated ? formatTimestamp(timeline?.firstSuccessAt ?? null) : "Not reached"}
          </p>
        </div>
        <div className="rounded-[24px] border border-sky-400/10 bg-sky-400/[0.05] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Full Propagation</p>
          <p className="mt-3 text-lg font-semibold text-white" suppressHydrationWarning>
            {hydrated ? formatTimestamp(timeline?.fullPropagationAt ?? null) : "Not reached"}
          </p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Latest Progress</p>
          <p className="mt-3 text-lg font-semibold text-white">
            {timeline?.snapshots.at(-1)?.progress ?? 0}%
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
        {timeline && timeline.snapshots.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between text-xs uppercase tracking-[0.24em] text-slate-500">
              <span>0%</span>
              <span>Propagation over time</span>
              <span>100%</span>
            </div>
            <svg viewBox="0 0 100 100" className="h-56 w-full overflow-visible">
              <defs>
                <linearGradient id="timelineStroke" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#7DD3FC" />
                  <stop offset="100%" stopColor="#53E3A6" />
                </linearGradient>
              </defs>
              <g>
                {Array.from({ length: 5 }).map((_, index) => {
                  const y = index * 25;
                  return (
                    <line
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
              </g>
              <polyline
                fill="none"
                stroke="url(#timelineStroke)"
                strokeWidth="2.2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={chartPoints.polyline}
              />
              {chartPoints.coordinates.map((snapshot, index) => {
                return (
                  <circle
                    key={`${snapshot.timestamp}-${index}`}
                    cx={snapshot.x}
                    cy={snapshot.y}
                    r="1.7"
                    fill={snapshot.progress === 100 ? "#53E3A6" : "#7DD3FC"}
                  />
                );
              })}
            </svg>
            <div className="flex justify-between text-xs text-slate-500">
              <span suppressHydrationWarning>
                {hydrated ? formatTimestamp(timeline.snapshots[0]?.timestamp ?? null) : "Not reached"}
              </span>
              <span suppressHydrationWarning>
                {hydrated
                  ? formatTimestamp(timeline.snapshots.at(-1)?.timestamp ?? null)
                  : "Not reached"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[224px] items-center justify-center text-sm text-slate-400">
            Run a live check to start collecting propagation history.
          </div>
        )}
      </div>
    </section>
  );
}
