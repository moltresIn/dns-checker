import { RESOLVERS } from "@/lib/resolvers";
import { createEmptyTimeline, rebuildTimeline } from "@/lib/timelineStore";
import type {
  DnsTimeline,
  DomainCheckSummary,
  RecordType,
  ResolverMapNode,
  ResolverResult
} from "@/lib/types";

export type DomainViewState = {
  domain: string;
  results: ResolverMapNode[];
  summary: DomainCheckSummary;
  timeline: DnsTimeline;
  checkedAt: number | null;
  completed: boolean;
  cachedCount: number;
};

export function createSummary(
  domain: string,
  results: ResolverMapNode[]
): DomainCheckSummary {
  const successResults = results.filter(
    (result) => result.status === "success" && result.time !== null
  );
  const finalResults = results.filter(
    (result) =>
      result.status === "success" ||
      result.status === "failed" ||
      result.status === "timeout"
  );
  const propagationPercent = Math.round(
    (successResults.length / RESOLVERS.length) * 100
  );
  const fastestResolver =
    successResults
      .slice()
      .sort(
        (left, right) =>
          (left.time ?? Number.MAX_SAFE_INTEGER) -
          (right.time ?? Number.MAX_SAFE_INTEGER)
      )[0]?.resolver ?? null;

  let status: DomainCheckSummary["status"] = "idle";

  if (finalResults.length === 0) {
    status = "running";
  } else if (finalResults.length < RESOLVERS.length) {
    status = successResults.length > 0 ? "partial" : "running";
  } else if (successResults.length === RESOLVERS.length) {
    status = "complete";
  } else if (successResults.length === 0) {
    status = "failed";
  } else {
    status = "partial";
  }

  return {
    domain,
    successRate: Math.round((successResults.length / RESOLVERS.length) * 100),
    propagationPercent,
    fastestResolver,
    status,
    updatedAt: finalResults.at(-1)?.updatedAt ?? null
  };
}

export function createPendingResults(): ResolverMapNode[] {
  return RESOLVERS.map((resolver) => ({
    ...resolver,
    value: "Waiting for live result",
    status: "pending",
    time: null,
    attempts: null,
    updatedAt: null,
    matched: true
  }));
}

export function createDomainState(
  domain: string,
  recordType: RecordType
): DomainViewState {
  const results = createPendingResults();

  return {
    domain,
    results,
    summary: createSummary(domain, results),
    timeline: createEmptyTimeline(domain, recordType),
    checkedAt: null,
    completed: false,
    cachedCount: 0
  };
}

export function mergeResultIntoNodes(
  nodes: ResolverMapNode[],
  result: ResolverResult
): ResolverMapNode[] {
  return nodes.map((node) =>
    node.id === result.id
      ? {
          ...node,
          value: result.value,
          status: result.status,
          time: result.time,
          attempts: result.attempts,
          updatedAt: result.updatedAt,
          error: result.error,
          isMock: result.isMock,
          cached: result.cached
        }
      : node
  );
}

export function appendTimelineEntry(
  timeline: DnsTimeline,
  recordType: RecordType,
  result: ResolverResult
): DnsTimeline {
  return rebuildTimeline(timeline.domain, recordType, [
    ...timeline.history,
    {
      timestamp: result.updatedAt,
      resolverId: result.id,
      resolver: result.resolver,
      value: result.value,
      status: result.status
    }
  ]);
}
