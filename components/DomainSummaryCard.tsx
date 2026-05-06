import { StatusBadge } from "@/components/StatusBadge";
import type { DomainViewState } from "@/lib/domainState";

type DomainSummaryCardProps = {
  domain: string;
  state: DomainViewState;
  isActive: boolean;
  jobRunning: boolean;
  hydrated: boolean;
  onClick: (domain: string) => void;
};

export function DomainSummaryCard({
  domain,
  state,
  isActive,
  jobRunning,
  hydrated,
  onClick
}: DomainSummaryCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(domain)}
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
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Rate
          </div>
          <div className="mt-2 font-semibold text-white">
            {state.summary.successRate}%
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Fastest
          </div>
          <div className="mt-2 truncate font-semibold text-white">
            {state.summary.fastestResolver ?? "-"}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Updates
          </div>
          <div
            className="mt-2 font-semibold text-white"
            suppressHydrationWarning
          >
            {hydrated && state.checkedAt
              ? new Date(state.checkedAt).toLocaleTimeString()
              : "-"}
          </div>
        </div>
      </div>
    </button>
  );
}
