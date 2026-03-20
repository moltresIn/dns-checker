import { StatusBadge } from "@/components/StatusBadge";
import type { ResolverResult } from "@/lib/types";

type ResultsTableProps = {
  results: ResolverResult[];
  loading: boolean;
  hasChecked: boolean;
  hasActiveFilters: boolean;
};

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={index} className="border-t border-white/5">
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <td key={cellIndex} className="px-4 py-4">
              <div className="h-4 animate-pulse rounded-full bg-white/10" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ResultsTable({
  results,
  loading,
  hasChecked,
  hasActiveFilters
}: ResultsTableProps) {
  const hasResults = results.length > 0;

  return (
    <div className="glass-panel overflow-hidden rounded-[28px]">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Resolver Results</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-50">Propagation snapshot</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-400">
            Each resolver is queried independently so you can compare returned values, failures,
            and response times side by side.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead className="bg-white/[0.03]">
            <tr className="text-xs uppercase tracking-[0.24em] text-slate-500">
              <th className="px-4 py-4 font-medium">Resolver</th>
              <th className="px-4 py-4 font-medium">Provider</th>
              <th className="px-4 py-4 font-medium">Geography</th>
              <th className="px-4 py-4 font-medium">Value</th>
              <th className="px-4 py-4 font-medium">Status</th>
              <th className="px-4 py-4 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-200">
            {loading ? (
              <LoadingRows />
            ) : hasResults ? (
              results.map((result) => (
                <tr key={result.id} className="border-t border-white/5">
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
                    {result.time} ms
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center text-slate-400">
                  {hasChecked
                    ? hasActiveFilters
                      ? "No resolver results match the current filters."
                      : "The lookup completed without any displayable resolver results."
                    : "Run a lookup to see resolver responses here."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
