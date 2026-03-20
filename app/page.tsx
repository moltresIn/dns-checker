"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type FormEvent
} from "react";
import { BulkInput } from "@/components/BulkInput";
import { DomainInput } from "@/components/DomainInput";
import { LiveResultsTable } from "@/components/LiveResultsTable";
import { ResolverFilters } from "@/components/ResolverFilters";
import { ResolverGlobe } from "@/components/ResolverGlobe";
import { RecordTypeSelect } from "@/components/RecordTypeSelect";
import { StatusBadge } from "@/components/StatusBadge";
import { TimelineChart } from "@/components/TimelineChart";
import {
  EMPTY_FILTERS,
  applyResolverFilters,
  filterResolverNodes,
  getResolverFilterOptions,
  hasActiveFilters
} from "@/lib/filtering";
import { RESOLVERS } from "@/lib/resolvers";
import { createEmptyTimeline, rebuildTimeline } from "@/lib/timelineStore";
import type {
  DnsBulkResponse,
  DnsTimeline,
  DomainCheckSummary,
  RecordType,
  ResolverFilters as ResolverFiltersState,
  ResolverMapNode,
  ResolverResult,
  SocketEnvelope
} from "@/lib/types";

const initialRecordType: RecordType = "A";
const MAX_DOMAINS = 20;
type SearchMode = "single" | "bulk";

type DomainViewState = {
  domain: string;
  results: ResolverMapNode[];
  summary: DomainCheckSummary;
  timeline: DnsTimeline;
  checkedAt: number | null;
  completed: boolean;
  cachedCount: number;
};

function normalizePreviewDomain(input: string) {
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

  const labels = trimmed.split(".");

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

  return isValid ? trimmed : null;
}

function parseBulkPreviewInput(value: string) {
  const validDomains: string[] = [];
  const invalidDomains: string[] = [];
  const seen = new Set<string>();

  for (const entry of value.split(/[\n,]+/)) {
    const trimmed = entry.trim();

    if (!trimmed) {
      continue;
    }

    const normalized = normalizePreviewDomain(trimmed);

    if (!normalized) {
      invalidDomains.push(trimmed);
      continue;
    }

    if (!seen.has(normalized)) {
      seen.add(normalized);
      validDomains.push(normalized);
    }
  }

  return {
    validDomains,
    invalidDomains
  };
}

function createSummary(domain: string, results: ResolverMapNode[]): DomainCheckSummary {
  const successResults = results.filter((result) => result.status === "success" && result.time !== null);
  const finalResults = results.filter(
    (result) => result.status === "success" || result.status === "failed" || result.status === "timeout"
  );
  const propagationPercent = Math.round((successResults.length / RESOLVERS.length) * 100);
  const fastestResolver = successResults
    .slice()
    .sort((left, right) => (left.time ?? Number.MAX_SAFE_INTEGER) - (right.time ?? Number.MAX_SAFE_INTEGER))[0]
    ?.resolver ?? null;

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

function createPendingResults(): ResolverMapNode[] {
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

function createDomainState(domain: string, recordType: RecordType): DomainViewState {
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

function mergeResultIntoNodes(nodes: ResolverMapNode[], result: ResolverResult) {
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

function appendTimelineResult(timeline: DnsTimeline, recordType: RecordType, result: ResolverResult) {
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

export default function HomePage() {
  const [searchMode, setSearchMode] = useState<SearchMode>("bulk");
  const [bulkInput, setBulkInput] = useState("example.com\nopenai.com");
  const [singleInput, setSingleInput] = useState("example.com");
  const [recordType, setRecordType] = useState<RecordType>(initialRecordType);
  const [retryCount, setRetryCount] = useState(1);
  const [filters, setFilters] = useState<ResolverFiltersState>(EMPTY_FILTERS);
  const [domainStates, setDomainStates] = useState<Record<string, DomainViewState>>({});
  const [domainOrder, setDomainOrder] = useState<string[]>([]);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobRunning, setJobRunning] = useState(false);
  const [jobMeta, setJobMeta] = useState<DnsBulkResponse | null>(null);
  const [socketClientId, setSocketClientId] = useState<string | null>(null);
  const [socketClientToken, setSocketClientToken] = useState<string | null>(null);
  const [socketState, setSocketState] = useState<"connecting" | "ready" | "closed">("connecting");
  const [livePaused, setLivePaused] = useState(false);
  const [timelineRefreshing, setTimelineRefreshing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const bufferedMessagesRef = useRef<SocketEnvelope[]>([]);
  const livePausedRef = useRef(livePaused);
  const deferredBulkInput = useDeferredValue(bulkInput);
  const deferredSingleInput = useDeferredValue(singleInput);
  const deferredSearch = useDeferredValue(filters.search);
  const inputValue = searchMode === "single" ? singleInput : bulkInput;
  const deferredInputValue = searchMode === "single" ? deferredSingleInput : deferredBulkInput;
  const parsedInput = useMemo(() => parseBulkPreviewInput(deferredInputValue), [deferredInputValue]);
  const inputIsSettling = deferredInputValue !== inputValue;

  const effectiveFilters: ResolverFiltersState = {
    ...filters,
    search: deferredSearch
  };

  const activeDomainState = activeDomain ? domainStates[activeDomain] ?? null : null;
  const filteredResults = useMemo(
    () => (activeDomainState ? filterResolverNodes(activeDomainState.results, effectiveFilters) : []),
    [activeDomainState, effectiveFilters]
  );
  const mappedResults = useMemo(
    () => (activeDomainState ? applyResolverFilters(activeDomainState.results, effectiveFilters) : []),
    [activeDomainState, effectiveFilters]
  );
  const matchedMapCount = mappedResults.filter((resolver) => resolver.matched).length;
  const filterOptions = getResolverFilterOptions(RESOLVERS);
  const filterIsActive = hasActiveFilters(effectiveFilters);
  const totalSuccessCount = Object.values(domainStates).reduce(
    (count, state) => count + state.results.filter((result) => result.status === "success").length,
    0
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    livePausedRef.current = livePaused;
  }, [livePaused]);

  const applySocketMessage = useEffectEvent((message: SocketEnvelope) => {
    if (message.event === "socket:ready") {
      setSocketClientId(message.payload.clientId);
      setSocketClientToken(message.payload.clientToken);
      setSocketState("ready");
      return;
    }

    if (message.event === "dns:error") {
      setError(message.payload.message);
      setJobRunning(false);
      return;
    }

    if (message.event === "dns:job-complete") {
      setJobRunning(false);
      return;
    }

    if (message.event === "dns:update") {
      startTransition(() => {
        setDomainStates((current) => {
          const currentState =
            current[message.payload.domain] ?? createDomainState(message.payload.domain, message.payload.recordType);
          const nextResults = mergeResultIntoNodes(currentState.results, message.payload.result);
          const nextTimeline = appendTimelineResult(
            currentState.timeline,
            message.payload.recordType,
            message.payload.result
          );

          return {
            ...current,
            [message.payload.domain]: {
              ...currentState,
              results: nextResults,
              summary: createSummary(message.payload.domain, nextResults),
              timeline: nextTimeline,
              checkedAt: message.payload.result.updatedAt,
              cachedCount: currentState.cachedCount + (message.payload.result.cached ? 1 : 0)
            }
          };
        });
      });
      return;
    }

    if (message.event === "dns:domain-complete") {
      startTransition(() => {
        setDomainStates((current) => {
          const currentState =
            current[message.payload.domain] ?? createDomainState(message.payload.domain, message.payload.recordType);

          return {
            ...current,
            [message.payload.domain]: {
              ...currentState,
              results: currentState.results.map((node) => {
                const match = message.payload.results.find((result) => result.id === node.id);

                return match
                  ? {
                      ...node,
                      value: match.value,
                      status: match.status,
                      time: match.time,
                      attempts: match.attempts,
                      updatedAt: match.updatedAt,
                      error: match.error,
                      isMock: match.isMock,
                      cached: match.cached
                    }
                  : node;
              }),
              summary: message.payload.summary,
              checkedAt: message.payload.summary.updatedAt,
              completed: true
            }
          };
        });
      });
    }
  });

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);

    setSocketState("connecting");

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as SocketEnvelope;

      if (message.event !== "socket:ready" && livePausedRef.current) {
        bufferedMessagesRef.current.push(message);
        return;
      }

      applySocketMessage(message);
    };

    socket.onclose = () => {
      setSocketState("closed");
      setSocketClientId(null);
      setSocketClientToken(null);
    };

    socket.onerror = () => {
      setSocketState("closed");
      setSocketClientId(null);
      setSocketClientToken(null);
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (!livePaused && bufferedMessagesRef.current.length > 0) {
      const bufferedMessages = bufferedMessagesRef.current.slice();
      bufferedMessagesRef.current = [];
      bufferedMessages.forEach((message) => applySocketMessage(message));
    }
  }, [livePaused]);

  function handleSelectionChange(
    key: "providers" | "regions" | "countries",
    values: string[]
  ) {
    setFilters((current) => ({
      ...current,
      [key]: values
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (socketState !== "ready" || !socketClientId || !socketClientToken) {
      setError("Live socket is still connecting. Please wait a moment and try again.");
      return;
    }

    if (parsedInput.validDomains.length === 0) {
      setError("Please provide at least one valid domain.");
      return;
    }

    if (parsedInput.validDomains.length > MAX_DOMAINS) {
      setError(`You can check up to ${MAX_DOMAINS} domains at a time.`);
      return;
    }

    const nextDomains = parsedInput.validDomains;
    setJobRunning(true);
    setJobMeta(null);
    setDomainOrder(nextDomains);
    setActiveDomain((current) => (current && nextDomains.includes(current) ? current : nextDomains[0] ?? null));
    setDomainStates((current) => {
      const nextState: Record<string, DomainViewState> = {};

      for (const domain of nextDomains) {
        nextState[domain] = {
          ...createDomainState(domain, recordType),
          timeline:
            current[domain]?.timeline.domain === domain &&
            current[domain]?.timeline.recordType === recordType
              ? current[domain].timeline
              : createEmptyTimeline(domain, recordType)
        };
      }

      return nextState;
    });

    try {
      const response = await fetch("/api/dns-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          domains: nextDomains,
          recordType,
          clientId: socketClientId,
          clientToken: socketClientToken,
          retryCount
        })
      });

      const payload = (await response.json()) as DnsBulkResponse | { error: string; invalidDomains?: string[] };

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : "Unable to start DNS bulk check.");
      }

      const data = payload as DnsBulkResponse;
      setJobMeta(data);

      if (data.invalidDomains.length > 0) {
        setError(`Skipped invalid domains: ${data.invalidDomains.join(", ")}`);
      }
    } catch (requestError) {
      setJobRunning(false);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    }
  }

  async function refreshTimeline() {
    if (!activeDomain) {
      return;
    }

    setTimelineRefreshing(true);

    try {
      const response = await fetch(
        `/api/dns-timeline?domain=${encodeURIComponent(activeDomain)}&recordType=${recordType}`
      );
      const payload = (await response.json()) as DnsTimeline | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("Unable to refresh the timeline.");
      }

      setDomainStates((current) => {
        const currentState = current[activeDomain];

        if (!currentState) {
          return current;
        }

        return {
          ...current,
          [activeDomain]: {
            ...currentState,
            timeline: payload
          }
        };
      });
    } catch (timelineError) {
      setError(timelineError instanceof Error ? timelineError.message : "Unexpected timeline error");
    } finally {
      setTimelineRefreshing(false);
    }
  }

  async function clearActiveTimeline() {
    if (!activeDomain) {
      return;
    }

    await fetch(`/api/dns-timeline?domain=${encodeURIComponent(activeDomain)}&recordType=${recordType}`, {
      method: "DELETE"
    });

    setDomainStates((current) => {
      const currentState = current[activeDomain];

      if (!currentState) {
        return current;
      }

      return {
        ...current,
        [activeDomain]: {
          ...currentState,
          timeline: createEmptyTimeline(activeDomain, recordType)
        }
      };
    });
  }

  function exportActiveTimeline() {
    if (!activeDomainState) {
      return;
    }

    const blob = new Blob([JSON.stringify(activeDomainState.timeline, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activeDomainState.domain}-${recordType.toLowerCase()}-timeline.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="glass-panel overflow-hidden rounded-[32px]">
          <div className="grid gap-10 px-6 py-8 lg:grid-cols-[1.25fr_0.75fr] lg:px-8 lg:py-10">
            <div>
              <p className="text-sm uppercase tracking-[0.36em] text-sky-300/75">DNS Lens Live</p>
              <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Bulk DNS propagation checks with live streaming and timeline tracking.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Stream resolver updates row by row, inspect propagation history over time, and run
                multiple domains in parallel without waiting for the entire batch to finish.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.24em] text-slate-300">
                <span className="rounded-full border border-sky-300/15 bg-sky-300/[0.08] px-3 py-2">
                  WebSocket live streaming
                </span>
                <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.08] px-3 py-2">
                  Bulk domain batches
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                  Timeline history in memory
                </span>
              </div>
            </div>

            <div className="panel-muted rounded-[28px] p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="metric-card rounded-2xl p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-emerald-300/75">
                    Domains
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-white">{domainOrder.length}</div>
                </div>
                <div className="metric-card rounded-2xl p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-sky-300/75">
                    Successes
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-white">{totalSuccessCount}</div>
                </div>
                <div className="metric-card rounded-2xl p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Socket</div>
                  <div className="mt-3 text-xl font-semibold text-white">{socketState}</div>
                </div>
              </div>

              <div className="metric-card mt-5 rounded-2xl p-4 text-sm text-slate-300">
                {jobMeta ? (
                  <>
                    Job <span className="font-mono text-white">{jobMeta.jobId.slice(0, 8)}</span> started at{" "}
                    <span className="font-medium text-white" suppressHydrationWarning>
                      {hydrated ? new Date(jobMeta.startedAt).toLocaleTimeString() : "--:--:--"}
                    </span>
                  </>
                ) : (
                  "Connect to the live socket, paste domains, and stream resolver updates in real time."
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[32px] p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="grid gap-6" suppressHydrationWarning>
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
                Search Mode
              </span>
              <div className="inline-flex w-full max-w-md rounded-[22px] border border-white/10 bg-slate-950/50 p-1">
                {([
                  { value: "single", label: "Single Search" },
                  { value: "bulk", label: "Bulk Search" }
                ] as const).map((mode) => {
                  const active = searchMode === mode.value;

                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setSearchMode(mode.value)}
                      suppressHydrationWarning
                      className={[
                        "flex-1 rounded-[18px] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition",
                        active
                          ? "bg-gradient-to-r from-sky-300 to-emerald-300 text-slate-950"
                          : "text-slate-300 hover:text-white"
                      ].join(" ")}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={[
                "grid gap-5",
                searchMode === "bulk"
                  ? "xl:grid-cols-[minmax(0,1fr)_220px_180px]"
                  : "xl:grid-cols-[minmax(0,1fr)_220px_180px_220px]"
              ].join(" ")}
            >
              {searchMode === "bulk" ? (
                <BulkInput
                  value={bulkInput}
                  onChange={setBulkInput}
                  disabled={jobRunning}
                  maxDomains={MAX_DOMAINS}
                  validCount={parsedInput.validDomains.length}
                  invalidEntries={parsedInput.invalidDomains}
                  isSettling={inputIsSettling}
                />
              ) : (
                <DomainInput value={singleInput} onChange={setSingleInput} disabled={jobRunning} />
              )}

              <RecordTypeSelect value={recordType} onChange={setRecordType} disabled={jobRunning} />

              <label className="flex flex-col gap-3">
                <span className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
                  Retries
                </span>
                <select
                  value={retryCount}
                  disabled={jobRunning}
                  onChange={(event) => setRetryCount(Number(event.target.value))}
                  suppressHydrationWarning
                  className="field-shell h-14 rounded-2xl px-4 text-base text-slate-100 outline-none transition duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {[0, 1, 2, 3].map((value) => (
                    <option key={value} value={value} className="bg-slate-950">
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              {searchMode === "single" ? (
                <div className="flex flex-col justify-end gap-3">
                  <button
                    type="submit"
                    disabled={jobRunning || inputIsSettling}
                    suppressHydrationWarning
                    className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-300 to-emerald-300 px-6 text-sm font-semibold uppercase tracking-[0.24em] text-slate-950 transition duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {jobRunning ? "Streaming..." : "Check DNS"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLivePaused((current) => !current)}
                    suppressHydrationWarning
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 px-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200 transition hover:border-white/20 hover:text-white"
                  >
                    {livePaused ? "Resume Live" : "Pause Live"}
                  </button>
                </div>
              ) : null}
            </div>

            {searchMode === "bulk" ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="submit"
                  disabled={jobRunning || inputIsSettling}
                  suppressHydrationWarning
                  className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-300 to-emerald-300 px-6 text-sm font-semibold uppercase tracking-[0.24em] text-slate-950 transition duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {jobRunning ? "Streaming..." : "Run Bulk Check"}
                </button>
                <button
                  type="button"
                  onClick={() => setLivePaused((current) => !current)}
                  suppressHydrationWarning
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 px-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200 transition hover:border-white/20 hover:text-white sm:h-14"
                >
                  {livePaused ? "Resume Live" : "Pause Live"}
                </button>
              </div>
            ) : null}
          </form>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
        </section>

        {domainOrder.length > 0 ? (
          <section className="glass-panel rounded-[32px] p-6 lg:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Bulk View</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">Per-domain status</h2>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-400">
                Select a domain to inspect its globe, live resolver stream, and timeline. Summary
                cards stay visible while the active detail panel changes below.
              </p>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {domainOrder.map((domain) => {
                const state = domainStates[domain] ?? createDomainState(domain, recordType);
                const isActive = activeDomain === domain;

                return (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => setActiveDomain(domain)}
                    suppressHydrationWarning
                    className={[
                      "rounded-[26px] border p-5 text-left shadow-[0_18px_45px_rgba(0,0,0,0.16)] transition",
                      isActive
                        ? "border-sky-300/40 bg-sky-300/[0.08]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-white">{domain}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
                          {state.summary.propagationPercent}% propagated
                        </p>
                      </div>
                      <StatusBadge
                        status={
                          state.summary.status === "complete"
                            ? "success"
                            : state.summary.status === "failed"
                              ? "failed"
                              : jobRunning
                                ? "pending"
                                : "idle"
                        }
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-slate-300">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Rate</div>
                        <div className="mt-2 font-semibold text-white">{state.summary.successRate}%</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Fastest</div>
                        <div className="mt-2 truncate font-semibold text-white">
                          {state.summary.fastestResolver ?? "-"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Updates</div>
                        <div className="mt-2 font-semibold text-white" suppressHydrationWarning>
                          {hydrated && state.checkedAt ? new Date(state.checkedAt).toLocaleTimeString() : "-"}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {activeDomainState ? (
          <>
            <ResolverFilters
              filters={filters}
              options={filterOptions}
              matchedCount={matchedMapCount}
              totalCount={RESOLVERS.length}
              onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
              onSelectionChange={handleSelectionChange}
              onResetFilters={() => setFilters(EMPTY_FILTERS)}
            />

            <ResolverGlobe
              resolvers={mappedResults}
              matchedCount={matchedMapCount}
              totalCount={RESOLVERS.length}
              loading={jobRunning}
            />

            <TimelineChart
              timeline={activeDomainState.timeline}
              refreshing={timelineRefreshing}
              onRefresh={refreshTimeline}
              onClear={clearActiveTimeline}
              onExport={exportActiveTimeline}
            />

            <LiveResultsTable
              results={filteredResults}
              loading={jobRunning}
              paused={livePaused}
              hasChecked={activeDomainState.checkedAt !== null}
              hasActiveFilters={filterIsActive}
            />
          </>
        ) : null}
      </div>
    </main>
  );
}
