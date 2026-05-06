"use client";

import { useState, type FormEvent } from "react";
import { createDomainState, type DomainViewState } from "@/lib/domainState";
import { createEmptyTimeline } from "@/lib/timelineStore";
import type { DnsBulkResponse, RecordType } from "@/lib/types";
import type { SocketConnectionState } from "@/hooks/useSocket";

export const MAX_DOMAINS = 20;

type UseDnsJobOptions = {
  recordType: RecordType;
  retryCount: number;
  parsedDomains: { validDomains: string[]; invalidDomains: string[] };
  inputIsSettling: boolean;
};

type SocketContext = {
  socketState: SocketConnectionState;
  clientId: string | null;
  clientToken: string | null;
};

export function useDnsJob({
  recordType,
  retryCount,
  parsedDomains,
  inputIsSettling
}: UseDnsJobOptions) {
  const [domainStates, setDomainStates] = useState<
    Record<string, DomainViewState>
  >({});
  const [domainOrder, setDomainOrder] = useState<string[]>([]);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [jobRunning, setJobRunning] = useState(false);
  const [jobMeta, setJobMeta] = useState<DnsBulkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleJobComplete() {
    setJobRunning(false);
  }

  function handleSocketError(message: string) {
    setError(message);
    setJobRunning(false);
  }

  function buildSubmitHandler({ socketState, clientId, clientToken }: SocketContext) {
    return async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setError(null);

      if (socketState !== "ready" || !clientId || !clientToken) {
        setError(
          "Live socket is still connecting. Please wait a moment and try again."
        );
        return;
      }

      if (parsedDomains.validDomains.length === 0) {
        setError("Please provide at least one valid domain.");
        return;
      }

      if (parsedDomains.validDomains.length > MAX_DOMAINS) {
        setError(`You can check up to ${MAX_DOMAINS} domains at a time.`);
        return;
      }

      if (inputIsSettling) {
        return;
      }

      const nextDomains = parsedDomains.validDomains;
      setJobRunning(true);
      setJobMeta(null);
      setDomainOrder(nextDomains);
      setActiveDomain((current) =>
        current && nextDomains.includes(current)
          ? current
          : (nextDomains[0] ?? null)
      );
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
            clientId,
            clientToken,
            retryCount
          })
        });

        const payload = (await response.json()) as
          | DnsBulkResponse
          | { error: string; invalidDomains?: string[] };

        if (!response.ok) {
          throw new Error(
            "error" in payload
              ? payload.error
              : "Unable to start DNS bulk check."
          );
        }

        const data = payload as DnsBulkResponse;
        setJobMeta(data);

        if (data.invalidDomains.length > 0) {
          setError(
            `Skipped invalid domains: ${data.invalidDomains.join(", ")}`
          );
        }
      } catch (requestError) {
        setJobRunning(false);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unexpected error"
        );
      }
    };
  }

  return {
    domainStates,
    setDomainStates,
    domainOrder,
    activeDomain,
    setActiveDomain,
    jobRunning,
    jobMeta,
    error,
    setError,
    handleJobComplete,
    handleSocketError,
    buildSubmitHandler
  };
}
