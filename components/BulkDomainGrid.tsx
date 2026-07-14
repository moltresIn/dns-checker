"use client";

import { Box } from "@/components/animate-ui/components/layout/box";
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelTitle
} from "@/components/animate-ui/components/layout/panel";
import { Eyebrow } from "@/components/animate-ui/components/typography/text";
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
    <Panel className="p-6 lg:p-8">
      <Box className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PanelContent>
          <Eyebrow>Bulk view</Eyebrow>
          <PanelTitle className="mt-2">Per-domain status</PanelTitle>
        </PanelContent>
        <PanelDescription className="max-w-2xl">
          Select a domain to inspect its globe, live resolver stream, and
          timeline. Summary cards stay visible while the active detail panel
          changes below.
        </PanelDescription>
      </Box>

      <Box className="mt-6 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {domainOrder.map((domain, index) => {
          const state =
            domainStates[domain] ?? createDomainState(domain, recordType);

          return (
            <Box
              key={domain}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.05,
                type: "spring",
                stiffness: 260,
                damping: 24
              }}
            >
              <DomainSummaryCard
                domain={domain}
                state={state}
                isActive={activeDomain === domain}
                jobRunning={jobRunning}
                hydrated={hydrated}
                onClick={onSelectDomain}
              />
            </Box>
          );
        })}
      </Box>
    </Panel>
  );
}
