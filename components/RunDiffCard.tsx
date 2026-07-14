"use client";

import { Badge } from "@/components/animate-ui/components/display/badge";
import { Box } from "@/components/animate-ui/components/layout/box";
import {
  MetricCard,
  Panel,
  PanelContent,
  PanelDescription,
  PanelTitle
} from "@/components/animate-ui/components/layout/panel";
import { Eyebrow, Text } from "@/components/animate-ui/components/typography/text";
import { diffResolverRuns } from "@/lib/consensus";
import type { ResolverMapNode } from "@/lib/types";

type RunDiffCardProps = {
  previousResults: ResolverMapNode[] | null;
  currentResults: ResolverMapNode[];
  domain: string;
};

export function RunDiffCard({
  previousResults,
  currentResults,
  domain
}: RunDiffCardProps) {
  const diff = diffResolverRuns(previousResults, currentResults);

  if (!diff) {
    return null;
  }

  const totalChanges = diff.changed.length + diff.added.length + diff.removed.length;

  if (totalChanges === 0) {
    return (
      <Panel className="p-6 lg:p-8">
        <Eyebrow>Diff</Eyebrow>
        <PanelTitle className="mt-2">Versus previous run</PanelTitle>
        <PanelDescription className="mt-2">
          No answer or status changes for{" "}
          <Text as="span" className="inline font-medium text-white">
            {domain}
          </Text>{" "}
          since the last check ({diff.unchanged} resolvers unchanged).
        </PanelDescription>
      </Panel>
    );
  }

  const rows = [...diff.changed, ...diff.added, ...diff.removed].slice(0, 12);

  return (
    <Panel className="p-6 lg:p-8">
      <Box className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PanelContent>
          <Eyebrow>Diff</Eyebrow>
          <PanelTitle className="mt-2">Versus previous run</PanelTitle>
          <PanelDescription className="mt-2 max-w-2xl">
            Changes detected for{" "}
            <Text as="span" className="inline font-medium text-white">
              {domain}
            </Text>{" "}
            since the last completed check.
          </PanelDescription>
        </PanelContent>
        <Box className="flex flex-wrap gap-2">
          <Badge size="lg" className="normal-case tracking-normal">
            Changed {diff.changed.length}
          </Badge>
          <Badge variant="sky" size="lg" className="normal-case tracking-normal">
            Added {diff.added.length}
          </Badge>
          <Badge variant="danger" size="lg" className="normal-case tracking-normal">
            Removed {diff.removed.length}
          </Badge>
        </Box>
      </Box>

      <Box className="subtle-scrollbar mt-6 flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
        {rows.map((row) => (
          <MetricCard
            key={`${row.kind}-${row.id}`}
            className="border border-white/10 bg-black/40 p-4"
          >
            <Box className="flex flex-wrap items-center justify-between gap-2">
              <Text className="text-sm font-medium text-white">{row.resolver}</Text>
              <Badge
                size="sm"
                variant={row.kind === "changed" ? "warning" : row.kind === "added" ? "sky" : "danger"}
                className="normal-case tracking-normal"
              >
                {row.kind}
              </Badge>
            </Box>
            <Box className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <Box>
                <Text as="span" className="text-neutral-500">
                  Previous ({row.previousStatus})
                </Text>
                <Text
                  as="span"
                  className="mt-1 block break-all font-mono text-neutral-300"
                >
                  {row.previousValue}
                </Text>
              </Box>
              <Box>
                <Text as="span" className="text-neutral-500">
                  Current ({row.currentStatus})
                </Text>
                <Text
                  as="span"
                  className="mt-1 block break-all font-mono text-white"
                >
                  {row.currentValue}
                </Text>
              </Box>
            </Box>
          </MetricCard>
        ))}
      </Box>
    </Panel>
  );
}
