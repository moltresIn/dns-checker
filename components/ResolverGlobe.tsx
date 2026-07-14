"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Alert } from "@/components/animate-ui/components/feedback/alert";
import { Box } from "@/components/animate-ui/components/layout/box";
import {
  MetricCard,
  Panel,
  PanelContent,
  PanelDescription,
  PanelTitle
} from "@/components/animate-ui/components/layout/panel";
import { Eyebrow, Heading, Text } from "@/components/animate-ui/components/typography/text";
import { StatusBadge } from "@/components/StatusBadge";
import type { ResolverMapNode } from "@/lib/types";

const ResolverGlobeScene = dynamic(() => import("@/components/ResolverGlobeScene"), {
  ssr: false,
  loading: () => (
    <Box className="flex h-full min-h-[420px] items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.03] text-sm text-slate-400">
      Loading 3D globe...
    </Box>
  )
});

type ResolverGlobeProps = {
  resolvers: ResolverMapNode[];
  matchedCount: number;
  totalCount: number;
  loading: boolean;
};

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <Box className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
      <Box className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </Box>
  );
}

export function ResolverGlobe({
  resolvers,
  matchedCount,
  totalCount,
  loading
}: ResolverGlobeProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const focusedResolver =
    resolvers.find((resolver) => resolver.id === hoveredId) ||
    resolvers.find((resolver) => resolver.id === selectedId) ||
    resolvers.find((resolver) => resolver.matched) ||
    resolvers[0];

  return (
    <Panel className="p-6 lg:p-8">
      <Box className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <PanelContent>
          <Eyebrow>3D Globe</Eyebrow>
          <PanelTitle className="mt-2">Resolver footprint</PanelTitle>
          <PanelDescription className="mt-2 max-w-2xl">
            Rotate and zoom the globe to inspect resolver coverage. Hover or click a pin to inspect
            provider, country, status, and response time.
          </PanelDescription>
        </PanelContent>
        <Box className="flex flex-wrap items-center gap-3">
          <LegendDot color="#a3a3a3" label="Pending" />
          <LegendDot color="#fafafa" label="Success" />
          <LegendDot color="#737373" label="Timeout" />
          <LegendDot color="#525252" label="Failed" />
          <LegendDot color="#404040" label="Idle" />
        </Box>
      </Box>

      <Box className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Box className="globe-canvas relative min-h-[420px] overflow-hidden rounded-[28px] border border-white/10 bg-black">
          <ResolverGlobeScene
            resolvers={resolvers}
            selectedId={selectedId}
            onHoverChange={setHoveredId}
            onSelect={(id) => setSelectedId((current) => (current === id ? null : id))}
          />
          <Box className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-neutral-400 backdrop-blur">
            <Text as="span">
              Visible resolvers{" "}
              <Text as="span" className="inline font-semibold text-white">
                {matchedCount}
              </Text>{" "}
              / {totalCount}
            </Text>
            <Text as="span">{loading ? "Refreshing..." : "Drag to rotate, scroll to zoom"}</Text>
          </Box>
        </Box>

        <Box className="flex flex-col gap-4">
          <MetricCard className="border border-white/10 bg-white/[0.03] p-5">
            <Box className="flex items-center justify-between gap-3">
              <PanelContent>
                <Text as="span" className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  Focused Resolver
                </Text>
                <Heading level={3} className="mt-2">
                  {focusedResolver?.resolver ?? "Awaiting selection"}
                </Heading>
              </PanelContent>
              {focusedResolver ? (
                <StatusBadge status={focusedResolver.status} isMock={focusedResolver.isMock} />
              ) : null}
            </Box>

            {focusedResolver ? (
              <Box className="mt-5 space-y-3 text-sm text-slate-300">
                <Box className="grid gap-3 sm:grid-cols-2">
                  <MetricCard className="border border-white/10 bg-black/40 p-4">
                    <Text as="span" className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Provider
                    </Text>
                    <Text className="mt-2 font-medium text-white">{focusedResolver.provider}</Text>
                  </MetricCard>
                  <MetricCard className="border border-white/10 bg-black/40 p-4">
                    <Text as="span" className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Location
                    </Text>
                    <Text className="mt-2 font-medium text-white">{focusedResolver.location}</Text>
                  </MetricCard>
                </Box>

                <MetricCard className="border border-white/10 bg-slate-950/25 p-4">
                  <Box className="flex items-center justify-between gap-2">
                    <Text as="span" className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Resolver
                    </Text>
                    <CopyButton value={focusedResolver.server} label="Server" />
                  </Box>
                  <Text className="mt-2 font-mono text-sm text-white">{focusedResolver.server}</Text>
                </MetricCard>

                <Box className="grid gap-3 sm:grid-cols-2">
                  <MetricCard className="border border-white/10 bg-black/40 p-4">
                    <Text as="span" className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Region
                    </Text>
                    <Text className="mt-2 font-medium text-white">{focusedResolver.region}</Text>
                  </MetricCard>
                  <MetricCard className="border border-white/10 bg-black/40 p-4">
                    <Text as="span" className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Response Time
                    </Text>
                    <Text className="mt-2 font-medium text-white">
                      {focusedResolver.time !== null ? `${focusedResolver.time} ms` : "Awaiting lookup"}
                    </Text>
                  </MetricCard>
                </Box>

                <MetricCard className="border border-white/10 bg-slate-950/25 p-4">
                  <Box className="flex items-center justify-between gap-2">
                    <Text as="span" className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Response
                    </Text>
                    <CopyButton value={focusedResolver.value} label="Answer" />
                  </Box>
                  <Text className="mt-2 break-words font-mono text-xs leading-6 text-white">
                    {focusedResolver.value}
                  </Text>
                  {focusedResolver.error ? (
                    <Text className="mt-3 text-xs text-rose-300">{focusedResolver.error}</Text>
                  ) : null}
                </MetricCard>
              </Box>
            ) : (
              <Alert variant="muted" className="mt-5 border-dashed">
                Hover or select a resolver pin to inspect it here.
              </Alert>
            )}
          </MetricCard>

          <MetricCard className="border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
            Filters dim non-matching resolvers on the globe while the table shows only matching
            rows. This keeps geographic context without letting the two views drift apart.
          </MetricCard>
        </Box>
      </Box>
    </Panel>
  );
}
