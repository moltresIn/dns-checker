"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/animate-ui/components/buttons/button";
import { Alert } from "@/components/animate-ui/components/feedback/alert";
import { Form } from "@/components/animate-ui/components/form/form";
import { Field, FieldLabel } from "@/components/animate-ui/components/form/field";
import { Input } from "@/components/animate-ui/components/form/input";
import { SelectMenu } from "@/components/animate-ui/components/form/select-menu";
import { Box } from "@/components/animate-ui/components/layout/box";
import { Panel } from "@/components/animate-ui/components/layout/panel";
import {
  Tabs,
  TabsHighlight,
  TabsHighlightItem,
  TabsList,
  TabsTrigger
} from "@/components/animate-ui/primitives/animate/tabs";
import { BulkInput } from "@/components/BulkInput";
import { DomainInput } from "@/components/DomainInput";
import { RecordTypeSelect } from "@/components/RecordTypeSelect";
import { MAX_DOMAINS } from "@/hooks/useDnsJob";
import type { RecordType } from "@/lib/types";

export type SearchMode = "single" | "bulk";

type SearchFormProps = {
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  bulkInput: string;
  onBulkInputChange: (value: string) => void;
  singleInput: string;
  onSingleInputChange: (value: string) => void;
  recordType: RecordType;
  onRecordTypeChange: (value: RecordType) => void;
  retryCount: number;
  onRetryCountChange: (value: number) => void;
  expectedValue: string;
  onExpectedValueChange: (value: string) => void;
  jobRunning: boolean;
  livePaused: boolean;
  onTogglePause: () => void;
  inputIsSettling: boolean;
  parsedDomains: { validDomains: string[]; invalidDomains: string[] };
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const primaryButtonClassName =
  "h-14 rounded-2xl bg-gradient-to-r from-neutral-200 to-white px-6 text-sm font-semibold uppercase tracking-[0.24em] text-black shadow-none hover:from-white hover:to-neutral-100 disabled:opacity-60";

const secondaryButtonClassName =
  "h-12 rounded-2xl border border-white/10 bg-transparent px-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200 shadow-none hover:border-white/20 hover:bg-white/[0.04] sm:h-14";

const modeTabClassName =
  "relative z-10 flex-1 rounded-[18px] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:bg-transparent data-[state=inactive]:text-neutral-400 data-[state=inactive]:hover:text-white";

export function SearchForm({
  searchMode,
  onSearchModeChange,
  bulkInput,
  onBulkInputChange,
  singleInput,
  onSingleInputChange,
  recordType,
  onRecordTypeChange,
  retryCount,
  onRetryCountChange,
  expectedValue,
  onExpectedValueChange,
  jobRunning,
  livePaused,
  onTogglePause,
  inputIsSettling,
  parsedDomains,
  error,
  onSubmit
}: SearchFormProps) {
  return (
    <Panel className="p-6 lg:p-8">
      <Form onSubmit={onSubmit} className="grid gap-6" suppressHydrationWarning>
        <Field>
          <FieldLabel>Search mode</FieldLabel>
          <Tabs
            value={searchMode}
            onValueChange={(value) => onSearchModeChange(value as SearchMode)}
            className="w-full max-w-md"
          >
            <TabsList className="inline-flex w-full rounded-[22px] border border-white/10 bg-black/60 p-1">
              <TabsHighlight className="rounded-[18px] bg-gradient-to-r from-neutral-300 to-white">
                <TabsHighlightItem value="single" className="flex-1 rounded-[18px]">
                  <TabsTrigger value="single" className={modeTabClassName}>
                    Single Search
                  </TabsTrigger>
                </TabsHighlightItem>
                <TabsHighlightItem value="bulk" className="flex-1 rounded-[18px]">
                  <TabsTrigger value="bulk" className={modeTabClassName}>
                    Bulk Search
                  </TabsTrigger>
                </TabsHighlightItem>
              </TabsHighlight>
            </TabsList>
          </Tabs>
        </Field>

        <Box className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px_180px]">
          {searchMode === "bulk" ? (
            <BulkInput
              value={bulkInput}
              onChange={onBulkInputChange}
              disabled={jobRunning}
              maxDomains={MAX_DOMAINS}
              validCount={parsedDomains.validDomains.length}
              invalidEntries={parsedDomains.invalidDomains}
              isSettling={inputIsSettling}
            />
          ) : (
            <DomainInput
              value={singleInput}
              onChange={onSingleInputChange}
              disabled={jobRunning}
            />
          )}

          <RecordTypeSelect
            value={recordType}
            onChange={onRecordTypeChange}
            disabled={jobRunning}
          />

          <Field>
            <FieldLabel>Retries</FieldLabel>
            <SelectMenu
              value={String(retryCount)}
              disabled={jobRunning}
              aria-label="Retry count"
              onChange={(nextValue) => onRetryCountChange(Number(nextValue))}
              options={[0, 1, 2, 3].map((count) => ({
                value: String(count),
                label: String(count)
              }))}
            />
          </Field>
        </Box>

        <Field>
          <FieldLabel>Expected value (optional)</FieldLabel>
          <Input
            type="text"
            value={expectedValue}
            disabled={jobRunning}
            placeholder="e.g. 93.184.216.34 or target hostname"
            onChange={(event) => onExpectedValueChange(event.target.value)}
            suppressHydrationWarning
          />
          <span className="text-xs text-neutral-500">
            When set, mismatches are highlighted in the consensus card and results table.
          </span>
        </Field>

        {searchMode === "single" ? (
          <Box className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="submit"
              disabled={jobRunning || inputIsSettling}
              hoverScale={1.02}
              tapScale={0.98}
              className={primaryButtonClassName}
            >
              {jobRunning ? "Streaming..." : "Check DNS"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onTogglePause}
              hoverScale={1.01}
              tapScale={0.99}
              className={secondaryButtonClassName}
            >
              {livePaused ? "Resume Live" : "Pause Live"}
            </Button>
          </Box>
        ) : (
          <Box className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="submit"
              disabled={jobRunning || inputIsSettling}
              hoverScale={1.02}
              tapScale={0.98}
              className={primaryButtonClassName}
            >
              {jobRunning ? "Streaming..." : "Run Bulk Check"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onTogglePause}
              hoverScale={1.01}
              tapScale={0.99}
              className={secondaryButtonClassName}
            >
              {livePaused ? "Resume Live" : "Pause Live"}
            </Button>
          </Box>
        )}
      </Form>

      {error ? <Alert className="mt-5">{error}</Alert> : null}
    </Panel>
  );
}
