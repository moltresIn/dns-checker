import type { ResolverMapNode, ResolverStatus } from "@/lib/types";

export type ConsensusOutlier = {
  id: string;
  resolver: string;
  provider: string;
  value: string;
  status: ResolverStatus;
  reason: "mismatch" | "failed" | "timeout";
};

export type ConsensusSummary = {
  totalResolvers: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  timeoutCount: number;
  /** Number of resolvers returning the consensus value */
  agreementCount: number;
  /** Most common successful answer, or null if none yet */
  consensusValue: string | null;
  /** Distinct successful answers */
  distinctSuccessValues: string[];
  /** Share of total resolvers that match consensus (0–100) */
  agreementPercent: number;
  outliers: ConsensusOutlier[];
  /** True when at least one resolver has a final result */
  hasResults: boolean;
};

function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function computeConsensus(
  results: ResolverMapNode[]
): ConsensusSummary {
  const totalResolvers = results.length;
  const successResults = results.filter((result) => result.status === "success");
  const pendingCount = results.filter(
    (result) => result.status === "pending" || result.status === "idle"
  ).length;
  const failedCount = results.filter((result) => result.status === "failed").length;
  const timeoutCount = results.filter((result) => result.status === "timeout").length;

  const valueCounts = new Map<string, { count: number; display: string }>();

  for (const result of successResults) {
    const display = result.value.trim() || "(empty)";
    const key = normalizeAnswer(display).toLowerCase();
    const current = valueCounts.get(key);

    if (current) {
      current.count += 1;
    } else {
      valueCounts.set(key, { count: 1, display });
    }
  }

  let consensusValue: string | null = null;
  let agreementCount = 0;

  for (const entry of valueCounts.values()) {
    if (entry.count > agreementCount) {
      agreementCount = entry.count;
      consensusValue = entry.display;
    }
  }

  const consensusKey =
    consensusValue !== null
      ? normalizeAnswer(consensusValue).toLowerCase()
      : null;

  const distinctSuccessValues = Array.from(valueCounts.values())
    .sort((left, right) => right.count - left.count)
    .map((entry) => entry.display);

  const outliers: ConsensusOutlier[] = [];

  for (const result of results) {
    if (result.status === "success") {
      const key = normalizeAnswer(result.value.trim() || "(empty)").toLowerCase();

      if (consensusKey !== null && key !== consensusKey) {
        outliers.push({
          id: result.id,
          resolver: result.resolver,
          provider: result.provider,
          value: result.value.trim() || "(empty)",
          status: result.status,
          reason: "mismatch"
        });
      }

      continue;
    }

    if (result.status === "failed" || result.status === "timeout") {
      outliers.push({
        id: result.id,
        resolver: result.resolver,
        provider: result.provider,
        value: result.error?.trim() || result.value.trim() || result.status,
        status: result.status,
        reason: result.status
      });
    }
  }

  outliers.sort((left, right) => {
    const reasonOrder = { mismatch: 0, failed: 1, timeout: 2 } as const;
    return (
      reasonOrder[left.reason] - reasonOrder[right.reason] ||
      left.resolver.localeCompare(right.resolver)
    );
  });

  return {
    totalResolvers,
    successCount: successResults.length,
    pendingCount,
    failedCount,
    timeoutCount,
    agreementCount,
    consensusValue,
    distinctSuccessValues,
    agreementPercent:
      totalResolvers === 0
        ? 0
        : Math.round((agreementCount / totalResolvers) * 100),
    outliers,
    hasResults: results.some(
      (result) =>
        result.status === "success" ||
        result.status === "failed" ||
        result.status === "timeout"
    )
  };
}
