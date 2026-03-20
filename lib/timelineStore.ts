import { RESOLVERS } from "@/lib/resolvers";
import type { DnsTimeline, RecordType, ResolverResult, ResolverTimelineEntry } from "@/lib/types";

type TimelineBucket = {
  domain: string;
  recordType: RecordType;
  history: ResolverTimelineEntry[];
};

const MAX_TIMELINE_BUCKETS = 200;
const MAX_TIMELINE_HISTORY_ENTRIES = 256;

declare global {
  var __dnsTimelineStore__: Map<string, TimelineBucket> | undefined;
}

const timelineStore = globalThis.__dnsTimelineStore__ ?? new Map<string, TimelineBucket>();

if (!globalThis.__dnsTimelineStore__) {
  globalThis.__dnsTimelineStore__ = timelineStore;
}

function getTimelineKey(domain: string, recordType: RecordType) {
  return `${domain}:${recordType}`;
}

function touchTimelineBucket(key: string, bucket: TimelineBucket) {
  timelineStore.delete(key);
  timelineStore.set(key, bucket);

  while (timelineStore.size > MAX_TIMELINE_BUCKETS) {
    const oldestKey = timelineStore.keys().next().value;

    if (!oldestKey) {
      break;
    }

    timelineStore.delete(oldestKey);
  }
}

export function rebuildTimeline(
  domain: string,
  recordType: RecordType,
  history: ResolverTimelineEntry[]
): DnsTimeline {
  const latestPerResolver = new Map<string, ResolverTimelineEntry>();
  const snapshots = history.map((entry) => {
    latestPerResolver.set(entry.resolverId, entry);
    const successCount = Array.from(latestPerResolver.values()).filter(
      (item) => item.status === "success"
    ).length;

    return {
      timestamp: entry.timestamp,
      successCount,
      totalResolvers: RESOLVERS.length,
      progress: Math.round((successCount / RESOLVERS.length) * 100)
    };
  });

  const firstSuccessAt =
    snapshots.find((snapshot) => snapshot.successCount > 0)?.timestamp ?? null;
  const fullPropagationAt =
    snapshots.find((snapshot) => snapshot.successCount === RESOLVERS.length)?.timestamp ?? null;

  return {
    domain,
    recordType,
    history,
    snapshots,
    firstSuccessAt,
    fullPropagationAt,
    latestUpdateAt: history.at(-1)?.timestamp ?? null
  };
}

export function createEmptyTimeline(domain: string, recordType: RecordType): DnsTimeline {
  return rebuildTimeline(domain, recordType, []);
}

export function appendTimelineResult(domain: string, recordType: RecordType, result: ResolverResult) {
  const key = getTimelineKey(domain, recordType);
  const bucket = timelineStore.get(key) ?? {
    domain,
    recordType,
    history: []
  };

  bucket.history.push({
    timestamp: result.updatedAt,
    resolverId: result.id,
    resolver: result.resolver,
    value: result.value,
    status: result.status
  });

  if (bucket.history.length > MAX_TIMELINE_HISTORY_ENTRIES) {
    bucket.history.splice(0, bucket.history.length - MAX_TIMELINE_HISTORY_ENTRIES);
  }

  touchTimelineBucket(key, bucket);
  return rebuildTimeline(bucket.domain, bucket.recordType, bucket.history);
}

export function getTimeline(domain: string, recordType: RecordType) {
  const key = getTimelineKey(domain, recordType);
  const bucket = timelineStore.get(key);

  if (bucket) {
    touchTimelineBucket(key, bucket);
  }

  return bucket ? rebuildTimeline(bucket.domain, bucket.recordType, bucket.history) : null;
}

export function clearTimeline(domain: string, recordType: RecordType) {
  timelineStore.delete(getTimelineKey(domain, recordType));
}
