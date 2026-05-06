"use client";

import { useState } from "react";
import { createEmptyTimeline } from "@/lib/timelineStore";
import type { DomainViewState } from "@/lib/domainState";
import type { DnsTimeline, RecordType } from "@/lib/types";

type UseTimelineOptions = {
  activeDomain: string | null;
  activeDomainState: DomainViewState | null;
  recordType: RecordType;
  setDomainStates: (
    updater: (
      current: Record<string, DomainViewState>
    ) => Record<string, DomainViewState>
  ) => void;
  setError: (message: string) => void;
};

export function useTimeline({
  activeDomain,
  activeDomainState,
  recordType,
  setDomainStates,
  setError
}: UseTimelineOptions) {
  const [timelineRefreshing, setTimelineRefreshing] = useState(false);

  async function refreshTimeline() {
    if (!activeDomain) {
      return;
    }

    setTimelineRefreshing(true);

    try {
      const response = await fetch(
        `/api/dns-timeline?domain=${encodeURIComponent(activeDomain)}&recordType=${recordType}`
      );
      const payload = (await response.json()) as DnsTimeline | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("Unable to refresh the timeline.");
      }

      setDomainStates((current) => {
        const currentState = current[activeDomain];

        if (!currentState) {
          return current;
        }

        return {
          ...current,
          [activeDomain]: {
            ...currentState,
            timeline: payload as DnsTimeline
          }
        };
      });
    } catch (timelineError) {
      setError(
        timelineError instanceof Error
          ? timelineError.message
          : "Unexpected timeline error"
      );
    } finally {
      setTimelineRefreshing(false);
    }
  }

  async function clearTimeline() {
    if (!activeDomain) {
      return;
    }

    await fetch(
      `/api/dns-timeline?domain=${encodeURIComponent(activeDomain)}&recordType=${recordType}`,
      { method: "DELETE" }
    );

    setDomainStates((current) => {
      const currentState = current[activeDomain];

      if (!currentState) {
        return current;
      }

      return {
        ...current,
        [activeDomain]: {
          ...currentState,
          timeline: createEmptyTimeline(activeDomain, recordType)
        }
      };
    });
  }

  function exportTimeline() {
    if (!activeDomainState) {
      return;
    }

    const blob = new Blob(
      [JSON.stringify(activeDomainState.timeline, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activeDomainState.domain}-${recordType.toLowerCase()}-timeline.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return {
    timelineRefreshing,
    refreshTimeline,
    clearTimeline,
    exportTimeline
  };
}
