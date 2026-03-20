export const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "NS", "TXT"] as const;

export type RecordType = (typeof RECORD_TYPES)[number];

export type ResolverQueryStatus = "success" | "failed" | "timeout";

export type ResolverStatus = ResolverQueryStatus | "idle" | "pending";

export type DomainRunStatus = "idle" | "running" | "partial" | "complete" | "failed";

export type ResolverCoordinates = {
  lat: number;
  lng: number;
};

export type ResolverDefinition = {
  id: string;
  resolver: string;
  provider: string;
  region: string;
  country: string;
  city: string;
  location: string;
  server: string;
  coordinates: ResolverCoordinates;
};

export type ResolverResult = ResolverDefinition & {
  value: string;
  status: ResolverQueryStatus;
  time: number;
  attempts: number;
  updatedAt: number;
  error?: string;
  isMock?: boolean;
  cached?: boolean;
};

export type ResolverMapNode = ResolverDefinition & {
  value: string;
  status: ResolverStatus;
  time: number | null;
  attempts: number | null;
  updatedAt: number | null;
  error?: string;
  isMock?: boolean;
  cached?: boolean;
  matched: boolean;
};

export type ResolverFilters = {
  search: string;
  providers: string[];
  regions: string[];
  countries: string[];
};

export type ResolverFilterOptions = {
  providers: string[];
  regions: string[];
  countries: string[];
};

export type ResolverTimelineEntry = {
  timestamp: number;
  resolverId: string;
  resolver: string;
  value: string;
  status: ResolverQueryStatus;
};

export type PropagationSnapshot = {
  timestamp: number;
  successCount: number;
  totalResolvers: number;
  progress: number;
};

export type DnsTimeline = {
  domain: string;
  recordType: RecordType;
  history: ResolverTimelineEntry[];
  snapshots: PropagationSnapshot[];
  firstSuccessAt: number | null;
  fullPropagationAt: number | null;
  latestUpdateAt: number | null;
};

export type DomainCheckSummary = {
  domain: string;
  successRate: number;
  propagationPercent: number;
  fastestResolver: string | null;
  status: DomainRunStatus;
  updatedAt: number | null;
};

export type DnsSyncResponse = {
  domain: string;
  recordType: RecordType;
  cached: boolean;
  checkedAt: string;
  results: ResolverResult[];
};

export type DnsBulkRequest = {
  domains: string[];
  recordType: RecordType;
  clientId: string;
  clientToken: string;
  retryCount?: number;
};

export type DnsBulkResponse = {
  jobId: string;
  domains: string[];
  invalidDomains: string[];
  recordType: RecordType;
  startedAt: number;
  maxDomains: number;
};

export type DnsUpdatePayload = {
  jobId: string;
  domain: string;
  recordType: RecordType;
  result: ResolverResult;
  completedCount: number;
  totalResolvers: number;
  progress: number;
};

export type DnsDomainCompletePayload = {
  jobId: string;
  domain: string;
  recordType: RecordType;
  results: ResolverResult[];
  summary: DomainCheckSummary;
};

export type DnsJobCompletePayload = {
  jobId: string;
  domains: string[];
  recordType: RecordType;
  finishedAt: number;
};

export type DnsErrorPayload = {
  jobId?: string;
  domain?: string;
  message: string;
};

export type SocketReadyPayload = {
  clientId: string;
  clientToken: string;
};

export type SocketEnvelope =
  | {
      event: "socket:ready";
      payload: SocketReadyPayload;
    }
  | {
      event: "dns:update";
      payload: DnsUpdatePayload;
    }
  | {
      event: "dns:domain-complete";
      payload: DnsDomainCompletePayload;
    }
  | {
      event: "dns:job-complete";
      payload: DnsJobCompletePayload;
    }
  | {
      event: "dns:error";
      payload: DnsErrorPayload;
    };
