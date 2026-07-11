"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import type { ResolverMapNode } from "@/lib/types";

type LiveResultsTableProps = {
  results: ResolverMapNode[];
  loading: boolean;
  paused: boolean;
  hasChecked: boolean;
  hasActiveFilters: boolean;
};

export function LiveResultsTable({
  results,
  loading,
  paused,
  hasChecked,
  hasActiveFilters
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

  return (
    <section className="glass-panel overflow-hidden rounded-[32px]">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Live Results</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-50">Resolver stream</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span>{streamStatus}</span>
            {paused ? (
              <span className="rounded-full border border-amber-400/20 px-3 py-1 text-amber-200">
                Updates paused
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur">
            <tr className="text-xs uppercase tracking-[0.24em] text-slate-500">
              <th className="px-4 py-4 font-medium">Resolver</th>
              <th className="px-4 py-4 font-medium">Provider</th>
              <th className="px-4 py-4 font-medium">Geography</th>
              <th className="px-4 py-4 font-medium">Response</th>
              <th className="px-4 py-4 font-medium">Status</th>
              <th className="px-4 py-4 font-medium">Latency</th>
              <th className="px-4 py-4 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-200">
            {results.length > 0 ? (
              results.map((result) => {
                const isFresh =
                  result.updatedAt !== null && now - result.updatedAt < 1400 && result.status !== "pending";

                return (
                  <tr
                    key={result.id}
                    className={[
                      "border-t border-white/5 transition-colors duration-500 hover:bg-white/[0.03]",
                      isFresh ? "bg-emerald-400/[0.04]" : ""
                    ].join(" ")}
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="font-medium text-slate-100">{result.resolver}</div>
                      <div className="mt-1 font-mono text-xs text-slate-500">{result.server}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-slate-300">{result.provider}</td>
                    <td className="px-4 py-4 align-top text-slate-300">
                      <div>{result.location}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                        {result.region}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="max-w-md break-words font-mono text-xs leading-6 text-slate-200">
                        {result.value}
                      </div>
                      {result.error ? (
                        <div className="mt-2 text-xs text-rose-300/90">{result.error}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusBadge status={result.status} isMock={result.isMock} />
                    </td>
                    <td className="px-4 py-4 align-top font-mono text-xs text-slate-300">
                      {result.time !== null ? `${result.time} ms` : "Pending"}
                      {result.attempts ? (
                        <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                          {result.attempts} attempt{result.attempts > 1 ? "s" : ""}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-slate-400">
                      <span suppressHydrationWarning>
                        {hydrated && result.updatedAt
                          ? new Date(result.updatedAt).toLocaleTimeString()
                          : "Waiting"}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center text-slate-400">
                  {hasChecked
                    ? hasActiveFilters
                      ? "No resolver rows match the current filters."
                      : "No resolver results are available for this domain yet."
                    : "Start a bulk or single-domain run to stream resolver updates here."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
