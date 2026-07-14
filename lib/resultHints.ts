import type { RecordType, ResolverMapNode } from "@/lib/types";
import { computeConsensus } from "@/lib/consensus";

export type ResultNextAction = {
  id: string;
  title: string;
  detail: string;
};

export function getResultNextActions(
  results: ResolverMapNode[],
  recordType: RecordType
): ResultNextAction[] {
  const consensus = computeConsensus(results);
  const actions: ResultNextAction[] = [];

  if (!consensus.hasResults) {
    return actions;
  }

  const successValues = consensus.distinctSuccessValues;
  const emptySuccesses = results.filter(
    (result) => result.status === "success" && !result.value.trim()
  );

  if (consensus.successCount === 0 && consensus.failedCount + consensus.timeoutCount > 0) {
    const nxMessages = results.filter((result) =>
      /nxdomain|not found|no such domain/i.test(
        `${result.error ?? ""} ${result.value}`
      )
    );

    if (nxMessages.length > 0) {
      actions.push({
        id: "nxdomain",
        title: "NXDOMAIN / not found",
        detail:
          "Resolvers report the name does not exist. Confirm the hostname, check NS delegation, and wait for negative-cache TTLs to expire."
      });
    } else {
      actions.push({
        id: "all-failed",
        title: "No successful answers",
        detail:
          "Every finished resolver failed or timed out. Verify the domain, record type, and that public resolvers can reach the authoritative servers."
      });
    }
  }

  if (recordType === "MX" && emptySuccesses.length > 0) {
    actions.push({
      id: "empty-mx",
      title: "Empty MX answers",
      detail:
        "Some resolvers returned an empty MX set. If you expect mail service, confirm MX records at the authoritative nameservers and check for a recent cutover."
    });
  }

  if (recordType === "MX" && consensus.successCount === 0 && consensus.hasResults) {
    actions.push({
      id: "missing-mx",
      title: "No MX records seen",
      detail:
        "No MX answers yet. Mail may fall back to the A/AAAA record, or the MX change may still be caching."
    });
  }

  if (recordType === "TXT") {
    const joined = successValues.join(" ").toLowerCase();
    if (joined.includes("v=spf1") && /[~?-]all/.test(joined) === false && !joined.includes("-all")) {
      actions.push({
        id: "spf-incomplete",
        title: "SPF may be incomplete",
        detail:
          "An SPF TXT was found. Double-check mechanisms and a terminal `~all` / `-all` qualifier if mail authentication is required."
      });
    }

    if (emptySuccesses.length > 0) {
      actions.push({
        id: "empty-txt",
        title: "Empty TXT answers",
        detail:
          "Some resolvers returned blank TXT data. Confirm the TXT string is published and that you are checking the correct hostname (including selectors)."
      });
    }
  }

  if (consensus.distinctSuccessValues.length > 1) {
    actions.push({
      id: "split-brain",
      title: "Resolvers disagree",
      detail:
        "Multiple distinct answers are live. Lower TTLs, verify authoritative consistency, and watch until one value dominates."
    });
  }

  if (consensus.pendingCount > 0 && consensus.successCount > 0) {
    actions.push({
      id: "still-pending",
      title: "Propagation still in progress",
      detail: `${consensus.pendingCount} resolver(s) are still pending. Keep this tab open or re-run after the remaining TTL windows.`
    });
  }

  return actions.slice(0, 3);
}
