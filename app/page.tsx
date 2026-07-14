"use client";

import { Box, Main } from "@/components/animate-ui/components/layout/box";
import { BulkDomainGrid } from "@/components/BulkDomainGrid";
import { HeroPanel } from "@/components/HeroPanel";
import { ResultsSection } from "@/components/ResultsSection";
import { SearchForm, type SearchMode } from "@/components/SearchForm";
import { useDnsJob } from "@/hooks/useDnsJob";
import { useSocket } from "@/hooks/useSocket";
import { useTimeline } from "@/hooks/useTimeline";
import {
  EMPTY_FILTERS,
  applyResolverFilters,
  filterResolverNodes,
  getResolverFilterOptions,
  hasActiveFilters
} from "@/lib/filtering";
import { parseBulkPreviewInput } from "@/lib/inputParser";
import { RESOLVERS } from "@/lib/resolvers";
import type { RecordType, ResolverFilters as ResolverFiltersState } from "@/lib/types";
import { useEffect, useMemo, useState, useDeferredValue } from "react";

const FILTER_OPTIONS = getResolverFilterOptions(RESOLVERS);

export default function HomePage() {
  const [searchMode, setSearchMode] = useState<SearchMode>("single");
  const [bulkInput, setBulkInput] = useState("example.com\nopenai.com");
  const [singleInput, setSingleInput] = useState("example.com");
  const [recordType, setRecordType] = useState<RecordType>("A");
  const [retryCount, setRetryCount] = useState(1);
  const [expectedValue, setExpectedValue] = useState("");
  const [filters, setFilters] = useState<ResolverFiltersState>(EMPTY_FILTERS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const deferredBulkInput = useDeferredValue(bulkInput);
  const deferredSingleInput = useDeferredValue(singleInput);
  const deferredSearch = useDeferredValue(filters.search);

  const inputValue = searchMode === "single" ? singleInput : bulkInput;
  const deferredInputValue =
    searchMode === "single" ? deferredSingleInput : deferredBulkInput;

  const parsedDomains = useMemo(
    () => parseBulkPreviewInput(deferredInputValue),
    [deferredInputValue]
  );
  const inputIsSettling = deferredInputValue !== inputValue;

  const {
    domainStates,
    setDomainStates,
    previousRunResults,
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
  } = useDnsJob({
    recordType,
    retryCount,
    parsedDomains,
    inputIsSettling
  });

  const { socketState, clientId, clientToken, livePaused, togglePause } =
    useSocket({
      onJobComplete: handleJobComplete,
      onError: handleSocketError,
      onDomainStatesUpdate: setDomainStates
    });

  const handleSubmit = buildSubmitHandler({ socketState, clientId, clientToken });

  const activeDomainState = activeDomain
    ? (domainStates[activeDomain] ?? null)
    : null;

  const { timelineRefreshing, refreshTimeline, clearTimeline, exportTimeline } =
    useTimeline({
      activeDomain,
      activeDomainState,
      recordType,
      setDomainStates,
      setError
    });

  const effectiveFilters: ResolverFiltersState = {
    ...filters,
    search: deferredSearch
  };

  const filteredResults = useMemo(
    () =>
      activeDomainState
        ? filterResolverNodes(activeDomainState.results, effectiveFilters)
        : [],
    [activeDomainState, effectiveFilters]
  );

  const mappedResults = useMemo(
    () =>
      activeDomainState
        ? applyResolverFilters(activeDomainState.results, effectiveFilters)
        : [],
    [activeDomainState, effectiveFilters]
  );

  const matchedMapCount = mappedResults.filter((r) => r.matched).length;
  const filterIsActive = hasActiveFilters(effectiveFilters);

  const totalSuccessCount = Object.values(domainStates).reduce(
    (count, state) =>
      count +
      state.results.filter((result) => result.status === "success").length,
    0
  );

  return (
    <Main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <Box className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <HeroPanel
          domainCount={domainOrder.length}
          totalSuccessCount={totalSuccessCount}
          socketState={socketState}
          jobMeta={jobMeta}
          hydrated={hydrated}
        />

        <SearchForm
          searchMode={searchMode}
          onSearchModeChange={setSearchMode}
          bulkInput={bulkInput}
          onBulkInputChange={setBulkInput}
          singleInput={singleInput}
          onSingleInputChange={setSingleInput}
          recordType={recordType}
          onRecordTypeChange={setRecordType}
          retryCount={retryCount}
          onRetryCountChange={setRetryCount}
          expectedValue={expectedValue}
          onExpectedValueChange={setExpectedValue}
          jobRunning={jobRunning}
          livePaused={livePaused}
          onTogglePause={togglePause}
          inputIsSettling={inputIsSettling}
          parsedDomains={parsedDomains}
          error={error}
          onSubmit={handleSubmit}
        />

        <BulkDomainGrid
          domainOrder={domainOrder}
          domainStates={domainStates}
          activeDomain={activeDomain}
          jobRunning={jobRunning}
          hydrated={hydrated}
          recordType={recordType}
          onSelectDomain={setActiveDomain}
        />

        {activeDomainState ? (
          <ResultsSection
            filters={filters}
            filterOptions={FILTER_OPTIONS}
            matchedMapCount={matchedMapCount}
            mappedResults={mappedResults}
            filteredResults={filteredResults}
            activeDomainState={activeDomainState}
            previousResults={
              activeDomain ? (previousRunResults[activeDomain] ?? null) : null
            }
            expectedValue={expectedValue}
            recordType={recordType}
            jobRunning={jobRunning}
            livePaused={livePaused}
            filterIsActive={filterIsActive}
            totalResolverCount={RESOLVERS.length}
            timelineRefreshing={timelineRefreshing}
            onSearchChange={(value) =>
              setFilters((current) => ({ ...current, search: value }))
            }
            onSelectionChange={(key, values) =>
              setFilters((current) => ({ ...current, [key]: values }))
            }
            onResetFilters={() => setFilters(EMPTY_FILTERS)}
            onRefreshTimeline={refreshTimeline}
            onClearTimeline={clearTimeline}
            onExportTimeline={exportTimeline}
          />
        ) : null}
      </Box>
    </Main>
  );
}
