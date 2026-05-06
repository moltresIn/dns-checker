import { DomainSummaryCard } from "@/components/DomainSummaryCard";
import { createDomainState, type DomainViewState } from "@/lib/domainState";
import type { RecordType } from "@/lib/types";

type BulkDomainGridProps = {
  domainOrder: string[];
  domainStates: Record<string, DomainViewState>;
  activeDomain: string | null;
  jobRunning: boolean;
  hydrated: boolean;
  recordType: RecordType;
  onSelectDomain: (domain: string) => void;
};

export function BulkDomainGrid({
  domainOrder,
  domainStates,
  activeDomain,
  jobRunning,
  hydrated,
  recordType,
  onSelectDomain
}: BulkDomainGridProps) {
  if (domainOrder.length === 0) {
    return null;
  }

  return (
    <section className="glass-panel rounded-[32px] p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Bulk View
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50">
            Per-domain status
          </h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-slate-400">
          Select a domain to inspect its globe, live resolver stream, and
          timeline. Summary cards stay visible while the active detail panel
          changes below.
        </p>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {domainOrder.map((domain) => {
          const state =
            domainStates[domain] ?? createDomainState(domain, recordType);

          return (
            <DomainSummaryCard
              key={domain}
              domain={domain}
              state={state}
              isActive={activeDomain === domain}
              jobRunning={jobRunning}
              hydrated={hydrated}
              onClick={onSelectDomain}
            />
          );
        })}
      </div>
    </section>
  );
}
