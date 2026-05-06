import type { DnsBulkResponse } from "@/lib/types";
import type { SocketConnectionState } from "@/hooks/useSocket";

type HeroPanelProps = {
  domainCount: number;
  totalSuccessCount: number;
  socketState: SocketConnectionState;
  jobMeta: DnsBulkResponse | null;
  hydrated: boolean;
};

export function HeroPanel({
  domainCount,
  totalSuccessCount,
  socketState,
  jobMeta,
  hydrated
}: HeroPanelProps) {
  return (
    <section className="glass-panel overflow-hidden rounded-[32px]">
      <div className="grid gap-10 px-6 py-8 lg:grid-cols-[1.25fr_0.75fr] lg:px-8 lg:py-10">
        <div>
          <p className="text-sm uppercase tracking-[0.36em] text-sky-300/75">
            DNS Lens Live
          </p>
          <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Bulk DNS propagation checks with live streaming and timeline
            tracking.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Stream resolver updates row by row, inspect propagation history
            over time, and run multiple domains in parallel without waiting
            for the entire batch to finish.
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
              <div className="mt-3 text-3xl font-semibold text-white">
                {domainCount}
              </div>
            </div>
            <div className="metric-card rounded-2xl p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-sky-300/75">
                Successes
              </div>
              <div className="mt-3 text-3xl font-semibold text-white">
                {totalSuccessCount}
              </div>
            </div>
            <div className="metric-card rounded-2xl p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Socket
              </div>
              <div className="mt-3 text-xl font-semibold text-white">
                {socketState}
              </div>
            </div>
          </div>

          <div className="metric-card mt-5 rounded-2xl p-4 text-sm text-slate-300">
            {jobMeta ? (
              <>
                Job{" "}
                <span className="font-mono text-white">
                  {jobMeta.jobId.slice(0, 8)}
                </span>{" "}
                started at{" "}
                <span
                  className="font-medium text-white"
                  suppressHydrationWarning
                >
                  {hydrated
                    ? new Date(jobMeta.startedAt).toLocaleTimeString()
                    : "--:--:--"}
                </span>
              </>
            ) : (
              "Connect to the live socket, paste domains, and stream resolver updates in real time."
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
