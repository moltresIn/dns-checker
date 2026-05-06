import { Resolver } from "node:dns/promises";
import { performance } from "node:perf_hooks";
import { randomUUID } from "node:crypto";
import { domainToASCII } from "node:url";
import { emitToSocketClient } from "@/lib/socket";
import { appendTimelineResult } from "@/lib/timelineStore";
import { RESOLVERS } from "@/lib/resolvers";
import type {
  DnsBulkRequest,
  DnsBulkResponse,
  DomainCheckSummary,
  RecordType,
  ResolverMapNode,
  ResolverQueryStatus,
  ResolverResult
} from "@/lib/types";
import { RECORD_TYPES } from "@/lib/types";

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type BulkJobConfig = {
  jobId: string;
  clientId: string;
  domains: string[];
  recordType: RecordType;
  retryCount: number;
  startedAt: number;
};

const DNS_TIMEOUT_MS = 3500;
const CACHE_TTL_MS = 45_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 15;
const DEFAULT_RETRY_COUNT = 1;
const MAX_RETRY_COUNT = 3;
const MAX_BATCH_CACHE_ENTRIES = 200;
const MAX_RESOLVER_CACHE_ENTRIES = 2_000;
const MAX_RATE_LIMIT_ENTRIES = 5_000;
const MAX_ACTIVE_BULK_JOBS = 12;
const MAX_RESULT_VALUE_LENGTH = 512;
export const MAX_BULK_DOMAINS = 20;
export const DNS_QUERY_CONCURRENCY = 6;

declare global {
  var __dnsBatchCache__: Map<string, CacheEntry<ResolverResult[]>> | undefined;
  var __dnsResolverCache__: Map<string, CacheEntry<ResolverResult>> | undefined;
  var __dnsRateLimitStore__: Map<string, RateLimitEntry> | undefined;
  var __dnsInFlightResolverQueries__: Map<string, Promise<ResolverResult>> | undefined;
  var __dnsActiveBulkJobs__: Set<string> | undefined;
}

const batchCache = globalThis.__dnsBatchCache__ ?? new Map<string, CacheEntry<ResolverResult[]>>();
const resolverCache =
  globalThis.__dnsResolverCache__ ?? new Map<string, CacheEntry<ResolverResult>>();
const rateLimitStore =
  globalThis.__dnsRateLimitStore__ ?? new Map<string, RateLimitEntry>();
const inFlightResolverQueries =
  globalThis.__dnsInFlightResolverQueries__ ?? new Map<string, Promise<ResolverResult>>();
const activeBulkJobs = globalThis.__dnsActiveBulkJobs__ ?? new Set<string>();

if (!globalThis.__dnsBatchCache__) {
  globalThis.__dnsBatchCache__ = batchCache;
}

if (!globalThis.__dnsResolverCache__) {
  globalThis.__dnsResolverCache__ = resolverCache;
}

if (!globalThis.__dnsRateLimitStore__) {
  globalThis.__dnsRateLimitStore__ = rateLimitStore;
}

if (!globalThis.__dnsInFlightResolverQueries__) {
  globalThis.__dnsInFlightResolverQueries__ = inFlightResolverQueries;
}

if (!globalThis.__dnsActiveBulkJobs__) {
  globalThis.__dnsActiveBulkJobs__ = activeBulkJobs;
}

export function normalizeDomain(input: string) {
  const trimmed = input.trim().toLowerCase().replace(/\.$/, "");

  if (!trimmed || trimmed.length > 253) {
    return null;
  }

  if (
    trimmed.includes("://") ||
    trimmed.includes("/") ||
    trimmed.includes("?") ||
    trimmed.includes("#") ||
    trimmed.includes(" ")
  ) {
    return null;
  }

  const asciiDomain = domainToASCII(trimmed);

  if (!asciiDomain) {
    return null;
  }

  const labels = asciiDomain.split(".");

  if (labels.length < 2) {
    return null;
  }

  const isValid = labels.every((label) => {
    return (
      label.length > 0 &&
      label.length <= 63 &&
      !label.startsWith("-") &&
      !label.endsWith("-") &&
      /^[a-z0-9-]+$/i.test(label)
    );
  });

  return isValid ? asciiDomain : null;
}

export function isValidRecordType(input: string): input is RecordType {
  return RECORD_TYPES.includes(input as RecordType);
}

export function parseBulkDomains(inputs: string[]) {
  const normalizedDomains: string[] = [];
  const invalidDomains: string[] = [];
  const seen = new Set<string>();

  for (const value of inputs) {
    const domain = normalizeDomain(value);

    if (!domain) {
      if (value.trim()) {
        invalidDomains.push(value.trim());
      }
      continue;
    }

    if (!seen.has(domain)) {
      seen.add(domain);
      normalizedDomains.push(domain);
    }
  }

  return {
    domains: normalizedDomains,
    invalidDomains
  };
}

function getBatchCacheKey(domain: string, recordType: RecordType) {
  return `${domain}:${recordType}`;
}

function getResolverCacheKey(domain: string, recordType: RecordType, resolverId: string) {
  return `${domain}:${recordType}:${resolverId}`;
}

function getCachedValue<T>(store: Map<string, CacheEntry<T>>, key: string) {
  const entry = store.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }

  return entry.value;
}

function pruneExpiredEntries<T>(store: Map<string, CacheEntry<T>>) {
  const now = Date.now();

  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= now) {
      store.delete(key);
    }
  }
}

function enforceCacheLimit<T>(store: Map<string, CacheEntry<T>>, maxEntries: number) {
  while (store.size > maxEntries) {
    const oldestKey = store.keys().next().value;

    if (!oldestKey) {
      break;
    }

    store.delete(oldestKey);
  }
}

function setCachedValue<T>(
  store: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  maxEntries: number
) {
  pruneExpiredEntries(store);
  store.delete(key);
  store.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value
  });
  enforceCacheLimit(store, maxEntries);
}

export function getCachedResults(domain: string, recordType: RecordType) {
  return getCachedValue(batchCache, getBatchCacheKey(domain, recordType));
}

function setCachedResults(domain: string, recordType: RecordType, results: ResolverResult[]) {
  setCachedValue(batchCache, getBatchCacheKey(domain, recordType), results, MAX_BATCH_CACHE_ENTRIES);
}

export function checkRateLimit(identifier: string) {
  const now = Date.now();

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  while (rateLimitStore.size > MAX_RATE_LIMIT_ENTRIES) {
    const oldestKey = rateLimitStore.keys().next().value;

    if (!oldestKey) {
      break;
    }

    rateLimitStore.delete(oldestKey);
  }

  const current = rateLimitStore.get(identifier);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    });

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      retryAfterMs: RATE_LIMIT_WINDOW_MS
    };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: current.resetAt - now
    };
  }

  current.count += 1;
  rateLimitStore.set(identifier, current);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - current.count,
    retryAfterMs: current.resetAt - now
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Query timed out"));
    }, timeoutMs);
    timer.unref?.();

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function createResolver(server: string) {
  const resolver = new Resolver();
  resolver.setServers([server]);
  return resolver;
}

function resolveRecord(resolver: Resolver, domain: string, recordType: RecordType): Promise<unknown> {
  switch (recordType) {
    case "A":
      return resolver.resolve4(domain);
    case "AAAA":
      return resolver.resolve6(domain);
    case "CNAME":
      return resolver.resolveCname(domain);
    case "MX":
      return resolver.resolveMx(domain);
    case "NS":
      return resolver.resolveNs(domain);
    case "TXT":
      return resolver.resolveTxt(domain);
  }
}

function normalizeAnswers(recordType: RecordType, response: unknown): string[] {
  switch (recordType) {
    case "A":
    case "AAAA":
    case "CNAME":
    case "NS":
      return (response as string[]).map((value) => value.trim().slice(0, MAX_RESULT_VALUE_LENGTH));
    case "MX":
      return (response as { exchange: string; priority: number }[])
        .slice()
        .sort((left, right) => left.priority - right.priority)
        .map((record) => `${record.priority} ${record.exchange}`.slice(0, MAX_RESULT_VALUE_LENGTH));
    case "TXT":
      return (response as string[][]).map((record) =>
        record.join("").slice(0, MAX_RESULT_VALUE_LENGTH)
      );
    default:
      return [];
  }
}

function mapError(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String(error.code);

    if (code === "ENOTFOUND") {
      return "NXDOMAIN";
    }

    if (["ETIMEOUT", "ESERVFAIL", "EREFUSED", "EFORMERR", "ENODATA", "ENOTIMP"].includes(code)) {
      return code;
    }
  }

  if (error instanceof Error && error.message.toLowerCase().includes("timed out")) {
    return "ETIMEOUT";
  }

  return "DNS_QUERY_FAILED";
}

function sortResults(results: ResolverResult[]) {
  return results.slice().sort((left, right) => {
    const leftIndex = RESOLVERS.findIndex((resolver) => resolver.id === left.id);
    const rightIndex = RESOLVERS.findIndex((resolver) => resolver.id === right.id);
    return leftIndex - rightIndex;
  });
}

export function createPendingResolverStates(): ResolverMapNode[] {
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

function computeDomainSummary(domain: string, results: ResolverResult[]): DomainCheckSummary {
  const successResults = results.filter((result) => result.status === "success");
  const fastestResolver = successResults
    .slice()
    .sort((left, right) => left.time - right.time)[0]?.resolver ?? null;
  const propagationPercent = Math.round((successResults.length / RESOLVERS.length) * 100);

  const allFailures = results.every((result) => result.status !== "success");
  const status: DomainCheckSummary["status"] =
    propagationPercent === 100
      ? "complete"
      : allFailures
        ? "failed"
        : successResults.length > 0
          ? "partial"
          : "running";

  return {
    domain,
    successRate: Math.round((successResults.length / RESOLVERS.length) * 100),
    propagationPercent,
    fastestResolver,
    status,
    updatedAt: results.at(-1)?.updatedAt ?? null
  };
}

async function queryResolverOnce(
  domain: string,
  recordType: RecordType,
  resolverInfo: (typeof RESOLVERS)[number],
  attempt: number
): Promise<ResolverResult> {
  const resolver = createResolver(resolverInfo.server);
  const startedAt = performance.now();

  try {
    const result = await withTimeout(resolveRecord(resolver, domain, recordType), DNS_TIMEOUT_MS);
    const answers = normalizeAnswers(recordType, result);

    return {
      ...resolverInfo,
      value: answers.length > 0 ? answers.join(", ") : "No records returned",
      status: "success",
      time: Math.round(performance.now() - startedAt),
      attempts: attempt,
      updatedAt: Date.now()
    };
  } catch (error) {
    const mappedError = mapError(error);
    const status: ResolverQueryStatus =
      mappedError.toLowerCase().includes("timed out") || mappedError === "ETIMEOUT"
        ? "timeout"
        : "failed";

    return {
      ...resolverInfo,
      value: "-",
      status,
      time: Math.round(performance.now() - startedAt),
      attempts: attempt,
      updatedAt: Date.now(),
      error: mappedError
    };
  }
}

async function queryResolverWithRetry(
  domain: string,
  recordType: RecordType,
  resolverInfo: (typeof RESOLVERS)[number],
  retryCount: number
) {
  let latestResult: ResolverResult | null = null;

  for (let attempt = 1; attempt <= retryCount + 1; attempt += 1) {
    latestResult = await queryResolverOnce(domain, recordType, resolverInfo, attempt);

    if (latestResult.status === "success") {
      return latestResult;
    }

    if (attempt <= retryCount) {
      await new Promise((resolve) => setTimeout(resolve, 180 * attempt));
    }
  }

  return latestResult as ResolverResult;
}

async function getResolverResult(
  domain: string,
  recordType: RecordType,
  resolverInfo: (typeof RESOLVERS)[number],
  retryCount: number
) {
  const cacheKey = getResolverCacheKey(domain, recordType, resolverInfo.id);
  const cached = getCachedValue(resolverCache, cacheKey);

  if (cached) {
    return {
      ...cached,
      cached: true,
      updatedAt: Date.now()
    };
  }

  const inFlightKey = cacheKey;
  const existingPromise = inFlightResolverQueries.get(inFlightKey);

  if (existingPromise) {
    const sharedResult = await existingPromise;
    return {
      ...sharedResult,
      updatedAt: Date.now()
    };
  }

  const nextPromise = queryResolverWithRetry(domain, recordType, resolverInfo, retryCount);
  inFlightResolverQueries.set(inFlightKey, nextPromise);

  try {
    const result = await nextPromise;
    setCachedValue(resolverCache, cacheKey, result, MAX_RESOLVER_CACHE_ENTRIES);
    return result;
  } finally {
    inFlightResolverQueries.delete(inFlightKey);
  }
}

async function runTaskPool(tasks: Array<() => Promise<void>>, concurrency: number) {
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (currentIndex < tasks.length) {
      const task = tasks[currentIndex];
      currentIndex += 1;
      await task();
    }
  });

  await Promise.all(workers);
}

export async function runDnsChecks(domain: string, recordType: RecordType) {
  const cachedResults = getCachedResults(domain, recordType);

  if (cachedResults) {
    return {
      results: cachedResults.map((result) => ({
        ...result,
        cached: true
      })),
      cached: true
    };
  }

  const results = await Promise.all(
    RESOLVERS.map((resolver) => getResolverResult(domain, recordType, resolver, DEFAULT_RETRY_COUNT))
  );
  const sortedResults = sortResults(results);
  setCachedResults(domain, recordType, sortedResults);

  for (const result of sortedResults) {
    if (!result.cached) {
      appendTimelineResult(domain, recordType, result);
    }
  }

  return {
    results: sortedResults,
    cached: false
  };
}

async function runBulkDnsJob({
  jobId,
  clientId,
  domains,
  recordType,
  retryCount,
  startedAt
}: BulkJobConfig) {
  const resultsByDomain = new Map<string, ResolverResult[]>();
  const tasks: Array<() => Promise<void>> = [];

  for (const domain of domains) {
    const cachedResults = getCachedResults(domain, recordType);

    if (cachedResults) {
      const cachedSnapshot = sortResults(
        cachedResults.map((result) => ({
          ...result,
          cached: true,
          updatedAt: Date.now()
        }))
      );

      resultsByDomain.set(domain, cachedSnapshot);

      cachedSnapshot.forEach((result, index) => {
        emitToSocketClient(clientId, {
          event: "dns:update",
          payload: {
            jobId,
            domain,
            recordType,
            result,
            completedCount: index + 1,
            totalResolvers: RESOLVERS.length,
            progress: Math.round(
              (cachedSnapshot
                .slice(0, index + 1)
                .filter((entry) => entry.status === "success").length /
                RESOLVERS.length) *
                100
            )
          }
        });
      });

      emitToSocketClient(clientId, {
        event: "dns:domain-complete",
        payload: {
          jobId,
          domain,
          recordType,
          results: cachedSnapshot,
          summary: computeDomainSummary(domain, cachedSnapshot)
        }
      });

      continue;
    }

    const domainResults: ResolverResult[] = [];
    resultsByDomain.set(domain, domainResults);

    for (const resolver of RESOLVERS) {
      tasks.push(async () => {
        const result = await getResolverResult(domain, recordType, resolver, retryCount);
        domainResults.push(result);

        appendTimelineResult(domain, recordType, result);

        emitToSocketClient(clientId, {
          event: "dns:update",
          payload: {
            jobId,
            domain,
            recordType,
            result,
            completedCount: domainResults.length,
            totalResolvers: RESOLVERS.length,
            progress: Math.round(
              (domainResults.filter((entry) => entry.status === "success").length /
                RESOLVERS.length) *
                100
            )
          }
        });

        if (domainResults.length === RESOLVERS.length) {
          const sortedResults = sortResults(domainResults);
          resultsByDomain.set(domain, sortedResults);
          setCachedResults(domain, recordType, sortedResults);

          emitToSocketClient(clientId, {
            event: "dns:domain-complete",
            payload: {
              jobId,
              domain,
              recordType,
              results: sortedResults,
              summary: computeDomainSummary(domain, sortedResults)
            }
          });
        }
      });
    }
  }

  await runTaskPool(tasks, DNS_QUERY_CONCURRENCY);

  emitToSocketClient(clientId, {
    event: "dns:job-complete",
    payload: {
      jobId,
      domains,
      recordType,
      finishedAt: Date.now()
    }
  });
}

export function startValidatedBulkJob(input: DnsBulkRequest): DnsBulkResponse {
  if (activeBulkJobs.size >= MAX_ACTIVE_BULK_JOBS) {
    throw new Error("Server is busy processing other DNS jobs. Please retry shortly.");
  }

  const retryCount = Math.min(
    Math.max(Math.trunc(input.retryCount ?? DEFAULT_RETRY_COUNT), 0),
    MAX_RETRY_COUNT
  );
  const response: DnsBulkResponse = {
    jobId: randomUUID(),
    domains: input.domains,
    invalidDomains: [],
    recordType: input.recordType,
    startedAt: Date.now(),
    maxDomains: MAX_BULK_DOMAINS
  };
  activeBulkJobs.add(response.jobId);

  void runBulkDnsJob({
    jobId: response.jobId,
    clientId: input.clientId,
    domains: input.domains,
    recordType: input.recordType,
    retryCount,
    startedAt: response.startedAt
  }).catch((error) => {
    emitToSocketClient(input.clientId, {
      event: "dns:error",
      payload: {
        jobId: response.jobId,
        message: error instanceof Error ? error.message : "Unexpected background DNS job error."
      }
    });
  }).finally(() => {
    activeBulkJobs.delete(response.jobId);
  });

  return response;
}
