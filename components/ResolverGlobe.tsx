"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import type { ResolverMapNode } from "@/lib/types";

const ResolverGlobeScene = dynamic(() => import("@/components/ResolverGlobeScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.03] text-sm text-slate-400">
      Loading 3D globe...
    </div>
  )
});

type ResolverGlobeProps = {
  resolvers: ResolverMapNode[];
  matchedCount: number;
  totalCount: number;
  loading: boolean;
};

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}

export function ResolverGlobe({
  resolvers,
  matchedCount,
  totalCount,
  loading
}: ResolverGlobeProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const focusedResolver =
    resolvers.find((resolver) => resolver.id === hoveredId) ||
    resolvers.find((resolver) => resolver.id === selectedId) ||
    resolvers.find((resolver) => resolver.matched) ||
    resolvers[0];

  return (
    <section className="glass-panel rounded-[32px] p-6 lg:p-8">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">3D Globe</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50">Resolver footprint</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Rotate and zoom the globe to inspect resolver coverage. Hover or click a pin to inspect
            provider, country, status, and response time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LegendDot color="#7DD3FC" label="Pending" />
          <LegendDot color="#53E3A6" label="Success" />
          <LegendDot color="#FBBF24" label="Timeout" />
          <LegendDot color="#FF6B6B" label="Failed" />
          <LegendDot color="#94A3B8" label="Idle" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="globe-canvas relative min-h-[420px] overflow-hidden rounded-[28px] border border-white/10 bg-[#08111F]">
          <ResolverGlobeScene
            resolvers={resolvers}
            selectedId={selectedId}
            onHoverChange={setHoveredId}
            onSelect={(id) => setSelectedId((current) => (current === id ? null : id))}
          />
          <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-slate-300 backdrop-blur">
            <span>
              Visible resolvers <span className="font-semibold text-white">{matchedCount}</span> /{" "}
              {totalCount}
            </span>
            <span>{loading ? "Refreshing..." : "Drag to rotate, scroll to zoom"}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Focused Resolver</p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  {focusedResolver?.resolver ?? "Awaiting selection"}
                </h3>
              </div>
              {focusedResolver ? (
                <StatusBadge status={focusedResolver.status} isMock={focusedResolver.isMock} />
              ) : null}
            </div>

            {focusedResolver ? (
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Provider</div>
                    <div className="mt-2 font-medium text-white">{focusedResolver.provider}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Location</div>
                    <div className="mt-2 font-medium text-white">{focusedResolver.location}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Resolver</div>
                  <div className="mt-2 font-mono text-sm text-white">{focusedResolver.server}</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Region</div>
                    <div className="mt-2 font-medium text-white">{focusedResolver.region}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Response Time
                    </div>
                    <div className="mt-2 font-medium text-white">
                      {focusedResolver.time !== null ? `${focusedResolver.time} ms` : "Awaiting lookup"}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Response</div>
                  <div className="mt-2 break-words font-mono text-xs leading-6 text-white">
                    {focusedResolver.value}
                  </div>
                  {focusedResolver.error ? (
                    <div className="mt-3 text-xs text-rose-300">{focusedResolver.error}</div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
                Hover or select a resolver pin to inspect it here.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
            Filters dim non-matching resolvers on the globe while the table shows only matching
            rows. This keeps geographic context without letting the two views drift apart.
          </div>
        </div>
      </div>
    </section>
  );
}
