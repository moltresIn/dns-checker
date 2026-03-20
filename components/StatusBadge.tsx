import type { ResolverStatus } from "@/lib/types";

type StatusBadgeProps = {
  status: ResolverStatus;
  isMock?: boolean;
};

const statusStyles: Record<ResolverStatus, string> = {
  idle: "bg-slate-400/10 text-slate-300 ring-1 ring-slate-300/10",
  pending: "bg-sky-400/15 text-sky-200 ring-1 ring-sky-300/20",
  success: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/20",
  failed: "bg-rose-400/15 text-rose-300 ring-1 ring-rose-400/20",
  timeout: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/20"
};

export function StatusBadge({ status, isMock = false }: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
        statusStyles[status]
      ].join(" ")}
    >
      {isMock && status !== "idle" && status !== "pending" ? `${status} mock` : status}
    </span>
  );
}
