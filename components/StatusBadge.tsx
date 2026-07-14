import { Badge } from "@/components/animate-ui/components/display/badge";
import type { ResolverStatus } from "@/lib/types";

type StatusBadgeProps = {
  status: ResolverStatus;
  isMock?: boolean;
};

const statusVariants: Record<
  ResolverStatus,
  "idle" | "pending" | "success" | "failed" | "timeout"
> = {
  idle: "idle",
  pending: "pending",
  success: "success",
  failed: "failed",
  timeout: "timeout"
};

export function StatusBadge({ status, isMock = false }: StatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status]}>
      {isMock && status !== "idle" && status !== "pending" ? `${status} mock` : status}
    </Badge>
  );
}
