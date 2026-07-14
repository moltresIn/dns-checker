"use client";

import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsHighlight,
  TabsHighlightItem,
  TabsList,
  TabsTrigger
} from "@/components/animate-ui/primitives/animate/tabs";
import { Box } from "@/components/animate-ui/components/layout/box";
import { ConsensusSummaryCard } from "@/components/ConsensusSummaryCard";
import { LiveResultsTable } from "@/components/LiveResultsTable";
import { ResolverFilters } from "@/components/ResolverFilters";
import { ResolverGlobe } from "@/components/ResolverGlobe";
import { RunDiffCard } from "@/components/RunDiffCard";
import { TimelineChart } from "@/components/TimelineChart";
import type { DomainViewState } from "@/lib/domainState";
import type {
  RecordType,
  ResolverFilterOptions,
  ResolverFilters as ResolverFiltersState,
  ResolverMapNode
} from "@/lib/types";
import { cn } from "@/lib/utils";

type FilterGroupKey = "providers" | "regions" | "countries";

type ResultsSectionProps = {
  filters: ResolverFiltersState;
  filterOptions: ResolverFilterOptions;
  matchedMapCount: number;
  mappedResults: ResolverMapNode[];
  filteredResults: ResolverMapNode[];
  activeDomainState: DomainViewState;
  previousResults: ResolverMapNode[] | null;
  expectedValue: string;
  recordType: RecordType;
  jobRunning: boolean;
  livePaused: boolean;
  filterIsActive: boolean;
  totalResolverCount: number;
  timelineRefreshing: boolean;
  onSearchChange: (value: string) => void;
  onSelectionChange: (key: FilterGroupKey, values: string[]) => void;
  onResetFilters: () => void;
  onRefreshTimeline: () => void;
  onClearTimeline: () => void;
  onExportTimeline: () => void;
};

const mobileTabTriggerClassName =
  "relative z-10 rounded-[16px] px-4 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:bg-transparent data-[state=inactive]:text-neutral-400 data-[state=inactive]:hover:text-white";

export function ResultsSection({
  filters,
  filterOptions,
  matchedMapCount,
  mappedResults,
  filteredResults,
  activeDomainState,
  previousResults,
  expectedValue,
  recordType,
  jobRunning,
  livePaused,
  filterIsActive,
  totalResolverCount,
  timelineRefreshing,
  onSearchChange,
  onSelectionChange,
  onResetFilters,
  onRefreshTimeline,
  onClearTimeline,
  onExportTimeline
}: ResultsSectionProps) {
  const filtersPanel = (
    <ResolverFilters
      filters={filters}
      options={filterOptions}
      matchedCount={matchedMapCount}
      totalCount={totalResolverCount}
      onSearchChange={onSearchChange}
      onSelectionChange={onSelectionChange}
      onResetFilters={onResetFilters}
    />
  );

  const globePanel = (
    <ResolverGlobe
      resolvers={mappedResults}
      matchedCount={matchedMapCount}
      totalCount={totalResolverCount}
      loading={jobRunning}
    />
  );

  const timelinePanel = (
    <TimelineChart
      timeline={activeDomainState.timeline}
      refreshing={timelineRefreshing}
      onRefresh={onRefreshTimeline}
      onClear={onClearTimeline}
      onExport={onExportTimeline}
    />
  );

  const tablePanel = (
    <LiveResultsTable
      results={filteredResults}
      loading={jobRunning}
      paused={livePaused}
      hasChecked={activeDomainState.checkedAt !== null}
      hasActiveFilters={filterIsActive}
      expectedValue={expectedValue}
      recordType={recordType}
    />
  );

  const consensusPanel = (
    <ConsensusSummaryCard
      results={activeDomainState.results}
      domain={activeDomainState.domain}
      recordType={recordType}
      hasChecked={activeDomainState.checkedAt !== null}
      loading={jobRunning}
      expectedValue={expectedValue}
    />
  );

  const diffPanel =
    activeDomainState.checkedAt !== null ? (
      <RunDiffCard
        previousResults={previousResults}
        currentResults={activeDomainState.results}
        domain={activeDomainState.domain}
      />
    ) : null;

  return (
    <>
      <Box className="hidden flex-col gap-8 lg:flex">
        {consensusPanel}
        {diffPanel}
        {filtersPanel}
        {globePanel}
        {timelinePanel}
        {tablePanel}
      </Box>

      <Box className="flex flex-col gap-6 lg:hidden">
        {consensusPanel}
        {diffPanel}

        <Tabs defaultValue="table" className="gap-6">
          <TabsList className="glass-panel inline-flex w-full rounded-[22px] border border-white/10 bg-black/60 p-1">
            <TabsHighlight className="rounded-[16px] bg-gradient-to-r from-neutral-300 to-white">
              <TabsHighlightItem value="filters" className="rounded-[16px]">
                <TabsTrigger value="filters" className={cn(mobileTabTriggerClassName)}>
                  Filters
                </TabsTrigger>
              </TabsHighlightItem>
              <TabsHighlightItem value="globe" className="rounded-[16px]">
                <TabsTrigger value="globe" className={cn(mobileTabTriggerClassName)}>
                  Globe
                </TabsTrigger>
              </TabsHighlightItem>
              <TabsHighlightItem value="timeline" className="rounded-[16px]">
                <TabsTrigger value="timeline" className={cn(mobileTabTriggerClassName)}>
                  Timeline
                </TabsTrigger>
              </TabsHighlightItem>
              <TabsHighlightItem value="table" className="rounded-[16px]">
                <TabsTrigger value="table" className={cn(mobileTabTriggerClassName)}>
                  Table
                </TabsTrigger>
              </TabsHighlightItem>
            </TabsHighlight>
          </TabsList>

          <TabsContents>
            <TabsContent value="filters">{filtersPanel}</TabsContent>
            <TabsContent value="globe">{globePanel}</TabsContent>
            <TabsContent value="timeline">{timelinePanel}</TabsContent>
            <TabsContent value="table">{tablePanel}</TabsContent>
          </TabsContents>
        </Tabs>
      </Box>
    </>
  );
}
