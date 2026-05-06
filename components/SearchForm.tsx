"use client";

import type { FormEvent } from "react";
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
  jobRunning: boolean;
  livePaused: boolean;
  onTogglePause: () => void;
  inputIsSettling: boolean;
  parsedDomains: { validDomains: string[]; invalidDomains: string[] };
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

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
  jobRunning,
  livePaused,
  onTogglePause,
  inputIsSettling,
  parsedDomains,
  error,
  onSubmit
}: SearchFormProps) {
  return (
    <section className="glass-panel rounded-[32px] p-6 lg:p-8">
      <form onSubmit={onSubmit} className="grid gap-6" suppressHydrationWarning>
        {/* Mode toggle */}
        <div className="flex flex-col gap-3">          <span className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
            Search Mode
          </span>
          <div className="inline-flex w-full max-w-md rounded-[22px] border border-white/10 bg-slate-950/50 p-1">
            {(
              [
                { value: "single", label: "Single Search" },
                { value: "bulk", label: "Bulk Search" }
              ] as const
            ).map((mode) => {
              const active = searchMode === mode.value;

              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => onSearchModeChange(mode.value)}
                  suppressHydrationWarning
                  className={[
                    "flex-1 rounded-[18px] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition",
                    active
                      ? "bg-gradient-to-r from-sky-300 to-emerald-300 text-slate-950"
                      : "text-slate-300 hover:text-white"
                  ].join(" ")}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={[
            "grid gap-5",
            searchMode === "bulk"
              ? "xl:grid-cols-[minmax(0,1fr)_220px_180px]"
              : "xl:grid-cols-[minmax(0,1fr)_220px_180px_220px]"
          ].join(" ")}
        >
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

          <label className="flex flex-col gap-3">
            <span className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
              Retries
            </span>
            <select
              value={retryCount}
              disabled={jobRunning}
              onChange={(event) => onRetryCountChange(Number(event.target.value))}
              suppressHydrationWarning
              className="field-shell h-14 rounded-2xl px-4 text-base text-slate-100 outline-none transition duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {[0, 1, 2, 3].map((value) => (
                <option key={value} value={value} className="bg-slate-950">
                  {value}
                </option>
              ))}
            </select>
          </label>

          {searchMode === "single" ? (
            <div className="flex flex-col justify-end gap-3">
              <button
                type="submit"
                disabled={jobRunning || inputIsSettling}
                suppressHydrationWarning
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-300 to-emerald-300 px-6 text-sm font-semibold uppercase tracking-[0.24em] text-slate-950 transition duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {jobRunning ? "Streaming..." : "Check DNS"}
              </button>
              <button
                type="button"
                onClick={onTogglePause}
                suppressHydrationWarning
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 px-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200 transition hover:border-white/20 hover:text-white"
              >
                {livePaused ? "Resume Live" : "Pause Live"}
              </button>
            </div>
          ) : null}
        </div>

        {searchMode === "bulk" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={jobRunning || inputIsSettling}
              suppressHydrationWarning
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-300 to-emerald-300 px-6 text-sm font-semibold uppercase tracking-[0.24em] text-slate-950 transition duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {jobRunning ? "Streaming..." : "Run Bulk Check"}
            </button>
            <button
              type="button"
              onClick={onTogglePause}
              suppressHydrationWarning
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 px-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200 transition hover:border-white/20 hover:text-white sm:h-14"
            >
              {livePaused ? "Resume Live" : "Pause Live"}
            </button>
          </div>
        ) : null}
      </form>

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}
    </section>
  );
}
