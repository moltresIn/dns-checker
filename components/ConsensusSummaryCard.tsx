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
import {
  Eyebrow,
  Text
} from "@/components/animate-ui/components/typography/text";
import { ResultChipsRow } from "@/components/ResultChipsRow";
import {
  computeConsensus,
  type ConsensusOutlier
} from "@/lib/consensus";
import { getResultNextActions } from "@/lib/resultHints";
import type { RecordType, ResolverMapNode } from "@/lib/types";

type ConsensusSummaryCardProps = {
  results: ResolverMapNode[];
  domain: string;
  recordType: RecordType;
  hasChecked: boolean;
  loading: boolean;
  expectedValue?: string | null;
};

function outlierLabel(outlier: ConsensusOutlier) {
  if (outlier.reason === "expected-mismatch") {
    return "≠ expected";
  }

  if (outlier.reason === "mismatch") {
    return "Mismatch";
  }

  if (outlier.reason === "timeout") {
    return "Timeout";
  }

  return "Failed";
}

export function ConsensusSummaryCard({
  results,
  domain,
  recordType,
  hasChecked,
  loading,
  expectedValue
}: ConsensusSummaryCardProps) {
  if (!hasChecked && !loading) {
    return null;
  }

  const consensus = computeConsensus(results, expectedValue);
  const nextActions = getResultNextActions(results, recordType);

  return (
    <Panel className="p-6 lg:p-8">
      <Box className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PanelContent>
          <Eyebrow>Consensus</Eyebrow>
          <PanelTitle className="mt-2">Resolver agreement</PanelTitle>
          <PanelDescription className="mt-2 max-w-2xl">
            Snapshot of what public resolvers currently return for{" "}
            <Text as="span" className="inline font-medium text-white">
              {domain}
            </Text>
            .
          </PanelDescription>
        </PanelContent>

        {consensus.hasResults && consensus.consensusValue ? (
          <MetricCard className="border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-300">
            <Text as="span" className="font-semibold text-white">
              {consensus.agreementCount}/{consensus.totalResolvers}
            </Text>{" "}
            agree on{" "}
            <Text
              as="span"
              className="inline break-all font-mono text-sm text-white"
            >
              {consensus.consensusValue}
            </Text>
          </MetricCard>
        ) : null}
      </Box>

      {consensus.hasResults ? (
        <Box className="mt-5">
          <ResultChipsRow results={results} expectedValue={expectedValue} />
        </Box>
      ) : null}

      {!consensus.hasResults ? (
        <Box className="mt-6 rounded-[24px] border border-dashed border-white/10 px-4 py-5 text-sm text-neutral-400">
          {loading
            ? "Waiting for the first resolver responses…"
            : "Run a check to see consensus across resolvers."}
        </Box>
      ) : (
        <Box className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <MetricCard className="border border-white/10 bg-black/40 p-5">
            <Text as="span" className="text-xs uppercase tracking-[0.24em] text-neutral-500">
              Agreement
            </Text>

            {consensus.consensusValue ? (
              <>
                <Text className="mt-3 text-2xl font-semibold text-white">
                  {consensus.agreementCount} of {consensus.totalResolvers}{" "}
                  resolvers
                </Text>
                <Text className="mt-2 text-sm text-neutral-400">
                  {consensus.agreementPercent}% return the same answer
                  {consensus.distinctSuccessValues.length > 1
                    ? ` · ${consensus.distinctSuccessValues.length} distinct success values`
                    : ""}
                </Text>
                <Box className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <Text as="span" className="text-xs uppercase tracking-[0.24em] text-neutral-500">
                    Consensus answer
                  </Text>
                  <Text className="mt-2 break-all font-mono text-sm leading-6 text-white">
                    {consensus.consensusValue}
                  </Text>
                </Box>
                {consensus.expectedValue ? (
                  <Box className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <Text as="span" className="text-xs uppercase tracking-[0.24em] text-neutral-500">
                      Expected value
                    </Text>
                    <Text className="mt-2 break-all font-mono text-sm leading-6 text-white">
                      {consensus.expectedValue}
                    </Text>
                    <Text className="mt-2 text-sm text-neutral-400">
                      {consensus.expectedMatchCount} match ·{" "}
                      {consensus.expectedMismatchCount} mismatch
                    </Text>
                  </Box>
                ) : null}
              </>
            ) : (
              <>
                <Text className="mt-3 text-2xl font-semibold text-white">
                  No successful answers yet
                </Text>
                <Text className="mt-2 text-sm text-neutral-400">
                  {consensus.pendingCount > 0
                    ? `${consensus.pendingCount} still pending`
                    : "All finished resolvers failed or timed out"}
                  {consensus.failedCount + consensus.timeoutCount > 0
                    ? ` · ${consensus.failedCount + consensus.timeoutCount} failed/timeout`
                    : ""}
                </Text>
              </>
            )}
          </MetricCard>

          <MetricCard className="border border-white/10 bg-black/40 p-5">
            <Box className="flex items-center justify-between gap-3">
              <Text as="span" className="text-xs uppercase tracking-[0.24em] text-neutral-500">
                Outliers
              </Text>
              <Badge size="lg" className="normal-case tracking-normal">
                {consensus.outliers.length}
              </Badge>
            </Box>

            {consensus.outliers.length === 0 ? (
              <Text className="mt-4 text-sm text-neutral-400">
                {consensus.pendingCount > 0
                  ? "No mismatches yet — some resolvers are still pending."
                  : consensus.expectedValue
                    ? "All successful resolvers match the expected value."
                    : "All finished resolvers match the consensus answer."}
              </Text>
            ) : (
              <Box className="subtle-scrollbar mt-4 flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
                {consensus.outliers.map((outlier) => (
                  <Box
                    key={outlier.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3"
                  >
                    <Box className="flex flex-wrap items-center justify-between gap-2">
                      <Text className="text-sm font-medium text-white">
                        {outlier.resolver}
                      </Text>
                      <Badge
                        size="sm"
                        variant={
                          outlier.reason === "mismatch" ||
                          outlier.reason === "expected-mismatch"
                            ? "warning"
                            : "danger"
                        }
                        className="normal-case tracking-normal"
                      >
                        {outlierLabel(outlier)}
                      </Badge>
                    </Box>
                    <Text as="span" className="mt-1 block text-xs text-neutral-500">
                      {outlier.provider}
                    </Text>
                    <Text
                      as="span"
                      className="mt-2 block break-all font-mono text-xs leading-5 text-neutral-300"
                    >
                      {outlier.value}
                    </Text>
                  </Box>
                ))}
              </Box>
            )}
          </MetricCard>
        </Box>
      )}

      {nextActions.length > 0 ? (
        <Box className="mt-6 grid gap-3">
          {nextActions.map((action) => (
            <Box
              key={action.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <Text className="text-sm font-medium text-white">{action.title}</Text>
              <Text className="mt-1 text-sm leading-6 text-neutral-400">
                {action.detail}
              </Text>
            </Box>
          ))}
        </Box>
      ) : null}
    </Panel>
  );
}
