"use client";

import { startTransition, useEffect, useEffectEvent, useRef, useState } from "react";
import {
  appendTimelineEntry,
  createDomainState,
  createSummary,
  mergeResultIntoNodes,
  type DomainViewState
} from "@/lib/domainState";
import type { RecordType, SocketEnvelope } from "@/lib/types";

export type SocketConnectionState = "connecting" | "ready" | "closed";

type UseSocketOptions = {
  onJobComplete: () => void;
  onError: (message: string) => void;
  onDomainStatesUpdate: (
    updater: (
      current: Record<string, DomainViewState>
    ) => Record<string, DomainViewState>
  ) => void;
};

export function useSocket({
  onJobComplete,
  onError,
  onDomainStatesUpdate
}: UseSocketOptions) {
  const [socketState, setSocketState] =
    useState<SocketConnectionState>("connecting");
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [livePaused, setLivePaused] = useState(false);

  const bufferedMessagesRef = useRef<SocketEnvelope[]>([]);
  const livePausedRef = useRef(livePaused);

  useEffect(() => {
    livePausedRef.current = livePaused;
  }, [livePaused]);

  const applyMessage = useEffectEvent((message: SocketEnvelope) => {
    if (message.event === "socket:ready") {
      setClientId(message.payload.clientId);
      setClientToken(message.payload.clientToken);
      setSocketState("ready");
      return;
    }

    if (message.event === "dns:error") {
      onError(message.payload.message);
      onJobComplete();
      return;
    }

    if (message.event === "dns:job-complete") {
      onJobComplete();
      return;
    }

    if (message.event === "dns:update") {
      const { domain, recordType, result } = message.payload;

      startTransition(() => {
        onDomainStatesUpdate((current) => {
          const currentState =
            current[domain] ?? createDomainState(domain, recordType as RecordType);
          const nextResults = mergeResultIntoNodes(currentState.results, result);
          const nextTimeline = appendTimelineEntry(
            currentState.timeline,
            recordType as RecordType,
            result
          );

          return {
            ...current,
            [domain]: {
              ...currentState,
              results: nextResults,
              summary: createSummary(domain, nextResults),
              timeline: nextTimeline,
              checkedAt: result.updatedAt,
              cachedCount:
                currentState.cachedCount + (result.cached ? 1 : 0)
            }
          };
        });
      });
      return;
    }

    if (message.event === "dns:domain-complete") {
      const { domain, results, summary } = message.payload;

      startTransition(() => {
        onDomainStatesUpdate((current) => {
          const currentState =
            current[domain] ??
            createDomainState(domain, summary.status as RecordType);

          return {
            ...current,
            [domain]: {
              ...currentState,
              results: currentState.results.map((node) => {
                const match = results.find((r) => r.id === node.id);

                return match
                  ? {
                      ...node,
                      value: match.value,
                      status: match.status,
                      time: match.time,
                      attempts: match.attempts,
                      updatedAt: match.updatedAt,
                      error: match.error,
                      isMock: match.isMock,
                      cached: match.cached
                    }
                  : node;
              }),
              summary,
              checkedAt: summary.updatedAt,
              completed: true
            }
          };
        });
      });
    }
  });

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);

    setSocketState("connecting");

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as SocketEnvelope;

      if (message.event !== "socket:ready" && livePausedRef.current) {
        bufferedMessagesRef.current.push(message);
        return;
      }

      applyMessage(message);
    };

    socket.onclose = () => {
      setSocketState("closed");
      setClientId(null);
      setClientToken(null);
    };

    socket.onerror = () => {
      setSocketState("closed");
      setClientId(null);
      setClientToken(null);
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (!livePaused && bufferedMessagesRef.current.length > 0) {
      const buffered = bufferedMessagesRef.current.slice();
      bufferedMessagesRef.current = [];
      buffered.forEach((message) => applyMessage(message));
    }
  }, [livePaused]);

  function togglePause() {
    setLivePaused((current) => !current);
  }

  return {
    socketState,
    clientId,
    clientToken,
    livePaused,
    togglePause
  };
}
