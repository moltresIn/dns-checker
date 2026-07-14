"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Badge } from "@/components/animate-ui/components/display/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/animate-ui/components/data/table";
import { Box } from "@/components/animate-ui/components/layout/box";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle
} from "@/components/animate-ui/components/layout/panel";
import { Eyebrow, Text } from "@/components/animate-ui/components/typography/text";
import { CopyButton } from "@/components/CopyButton";
import { ResultChipsRow } from "@/components/ResultChipsRow";
import { StatusBadge } from "@/components/StatusBadge";
import { answersMatch } from "@/lib/consensus";
import { getResultNextActions } from "@/lib/resultHints";
import type { RecordType, ResolverMapNode } from "@/lib/types";
import { cn } from "@/lib/utils";

type LiveResultsTableProps = {
  results: ResolverMapNode[];
  loading: boolean;
  paused: boolean;
  hasChecked: boolean;
  hasActiveFilters: boolean;
  expectedValue?: string | null;
  recordType: RecordType;
};

export function LiveResultsTable({
  results,
  loading,
  paused,
  hasChecked,
  hasActiveFilters,
  expectedValue,
  recordType
}: LiveResultsTableProps) {
  const [now, setNow] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setNow(Date.now());

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const streamStatus = loading
    ? "Streaming live..."
    : hasChecked
      ? "Check complete"
      : "Awaiting next run";

  const emptyHint = (() => {
    if (!hasChecked) {
      return "Start a bulk or single-domain run to stream resolver updates here.";
    }

    if (hasActiveFilters) {
      return "No resolver rows match the current filters.";
    }

    const actions = getResultNextActions(results, recordType);
    if (actions[0]) {
      return `${actions[0].title}: ${actions[0].detail}`;
    }

    return "No resolver results are available for this domain yet.";
  })();

  return (
    <Panel className="overflow-hidden rounded-[32px]">
      <PanelHeader>
        <Box className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <PanelContent>
            <Eyebrow>Live results</Eyebrow>
            <PanelTitle className="mt-2">Resolver stream</PanelTitle>
          </PanelContent>
          <Box className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <Text as="span">{streamStatus}</Text>
            {paused ? (
              <Badge variant="warning" size="lg" className="normal-case">
                Updates paused
              </Badge>
            ) : null}
          </Box>
        </Box>
        {hasChecked || loading ? (
          <Box className="mt-4">
            <ResultChipsRow results={results} expectedValue={expectedValue} />
          </Box>
        ) : null}
      </PanelHeader>

      <Box className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resolver</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Geography</TableHead>
              <TableHead>Response</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Latency</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Copy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length > 0 ? (
              <AnimatePresence initial={false}>
                {results.map((result) => {
                  const isFresh =
                    result.updatedAt !== null &&
                    now - result.updatedAt < 1400 &&
                    result.status !== "pending";

                  const expectedMismatch =
                    Boolean(expectedValue?.trim()) &&
                    result.status === "success" &&
                    !answersMatch(result.value, expectedValue ?? "");

                  const copyPayload = [
                    result.resolver,
                    result.server,
                    result.status,
                    result.value,
                    result.error ?? ""
                  ]
                    .filter(Boolean)
                    .join("\n");

                  return (
                    <TableRow
                      key={result.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.22 }}
                      className={cn(
                        "border-t border-white/5 transition-colors duration-500 hover:bg-white/[0.03]",
                        isFresh ? "bg-white/[0.04]" : "",
                        expectedMismatch ? "bg-amber-400/[0.06]" : ""
                      )}
                    >
                      <TableCell>
                        <Box className="font-medium text-slate-100">
                          {result.resolver}
                        </Box>
                        <Text as="span" className="mt-1 block font-mono text-xs text-slate-500">
                          {result.server}
                        </Text>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {result.provider}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <Box>{result.location}</Box>
                        <Text as="span" className="mt-1 block text-xs text-slate-500">
                          {result.region}
                        </Text>
                      </TableCell>
                      <TableCell>
                        <Text
                          as="span"
                          className="block max-w-md break-words font-mono text-xs leading-6 text-slate-200"
                        >
                          {result.value}
                        </Text>
                        {expectedMismatch ? (
                          <Text as="span" className="mt-2 block text-xs text-amber-200">
                            Does not match expected value
                          </Text>
                        ) : null}
                        {result.error ? (
                          <Text as="span" className="mt-2 block text-xs text-rose-300/90">
                            {result.error}
                          </Text>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={result.status}
                          isMock={result.isMock}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-300">
                        {result.time !== null ? `${result.time} ms` : "Pending"}
                        {result.attempts ? (
                          <Text as="span" className="mt-1 block text-[11px] text-slate-500">
                            {result.attempts} attempt
                            {result.attempts > 1 ? "s" : ""}
                          </Text>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        <Text as="span" suppressHydrationWarning>
                          {hydrated && result.updatedAt
                            ? new Date(result.updatedAt).toLocaleTimeString()
                            : "Waiting"}
                        </Text>
                      </TableCell>
                      <TableCell>
                        <Box className="flex flex-col gap-1">
                          <CopyButton value={result.value} label="Answer" />
                          <CopyButton value={result.server} label="Server" />
                          <CopyButton value={copyPayload} label="Row" />
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </AnimatePresence>
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="px-6 py-14 text-center text-slate-400">
                  {emptyHint}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Panel>
  );
}
