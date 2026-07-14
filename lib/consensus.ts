import type { ResolverMapNode, ResolverStatus } from "@/lib/types";

export type ConsensusOutlier = {
  id: string;
  resolver: string;
  provider: string;
  value: string;
  status: ResolverStatus;
  reason: "mismatch" | "failed" | "timeout" | "expected-mismatch";
};

export type ConsensusSummary = {
  totalResolvers: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  timeoutCount: number;
  agreementCount: number;
  consensusValue: string | null;
  distinctSuccessValues: string[];
  agreementPercent: number;
  outliers: ConsensusOutlier[];
  hasResults: boolean;
  expectedValue: string | null;
  expectedMatchCount: number;
  expectedMismatchCount: number;
};

export type ResultChips = {
  distinct: number;
  consensus: number;
  pending: number;
  failed: number;
};

export type RunDiffChange = {
  id: string;
  resolver: string;
  previousValue: string;
  previousStatus: ResolverStatus;
  currentValue: string;
  currentStatus: ResolverStatus;
  kind: "changed" | "added" | "removed";
};

export type RunDiffSummary = {
  changed: RunDiffChange[];
  added: RunDiffChange[];
  removed: RunDiffChange[];
  unchanged: number;
};

export function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function answersMatch(left: string, right: string) {
  return (
    normalizeAnswer(left).toLowerCase() === normalizeAnswer(right).toLowerCase()
  );
}

export function computeConsensus(
  results: ResolverMapNode[],
  expectedValue?: string | null
): ConsensusSummary {
  const trimmedExpected = expectedValue?.trim() || null;
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

  let expectedMatchCount = 0;
  let expectedMismatchCount = 0;
  const outliers: ConsensusOutlier[] = [];

  for (const result of results) {
    if (result.status === "success") {
      const display = result.value.trim() || "(empty)";
      const key = normalizeAnswer(display).toLowerCase();

      if (trimmedExpected) {
        if (answersMatch(display, trimmedExpected)) {
          expectedMatchCount += 1;
        } else {
          expectedMismatchCount += 1;
          outliers.push({
            id: result.id,
            resolver: result.resolver,
            provider: result.provider,
            value: display,
            status: result.status,
            reason: "expected-mismatch"
          });
        }
      } else if (consensusKey !== null && key !== consensusKey) {
        outliers.push({
          id: result.id,
          resolver: result.resolver,
          provider: result.provider,
          value: display,
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
    const reasonOrder = {
      "expected-mismatch": 0,
      mismatch: 1,
      failed: 2,
      timeout: 3
    } as const;
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
    ),
    expectedValue: trimmedExpected,
    expectedMatchCount,
    expectedMismatchCount
  };
}

export function computeResultChips(
  results: ResolverMapNode[],
  expectedValue?: string | null
): ResultChips {
  const consensus = computeConsensus(results, expectedValue);

  return {
    distinct: consensus.distinctSuccessValues.length,
    consensus: consensus.agreementCount,
    pending: consensus.pendingCount,
    failed: consensus.failedCount + consensus.timeoutCount
  };
}

export function diffResolverRuns(
  previous: ResolverMapNode[] | null | undefined,
  current: ResolverMapNode[]
): RunDiffSummary | null {
  if (!previous || previous.length === 0) {
    return null;
  }

  const previousById = new Map(previous.map((node) => [node.id, node]));
  const currentById = new Map(current.map((node) => [node.id, node]));
  const changed: RunDiffChange[] = [];
  const added: RunDiffChange[] = [];
  const removed: RunDiffChange[] = [];
  let unchanged = 0;

  for (const node of current) {
    const prior = previousById.get(node.id);

    if (!prior) {
      added.push({
        id: node.id,
        resolver: node.resolver,
        previousValue: "—",
        previousStatus: "idle",
        currentValue: node.value,
        currentStatus: node.status,
        kind: "added"
      });
      continue;
    }

    const priorDisplay =
      prior.status === "success"
        ? prior.value.trim() || "(empty)"
        : prior.error?.trim() || prior.value || prior.status;
    const currentDisplay =
      node.status === "success"
        ? node.value.trim() || "(empty)"
        : node.error?.trim() || node.value || node.status;

    if (
      prior.status === node.status &&
      answersMatch(String(priorDisplay), String(currentDisplay))
    ) {
      unchanged += 1;
      continue;
    }

    changed.push({
      id: node.id,
      resolver: node.resolver,
      previousValue: String(priorDisplay),
      previousStatus: prior.status,
      currentValue: String(currentDisplay),
      currentStatus: node.status,
      kind: "changed"
    });
  }

  for (const prior of previous) {
    if (!currentById.has(prior.id)) {
      removed.push({
        id: prior.id,
        resolver: prior.resolver,
        previousValue: prior.value,
        previousStatus: prior.status,
        currentValue: "—",
        currentStatus: "idle",
        kind: "removed"
      });
    }
  }

  return { changed, added, removed, unchanged };
}
