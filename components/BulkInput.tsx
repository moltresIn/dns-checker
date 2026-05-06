type BulkInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxDomains: number;
  validCount: number;
  invalidEntries: string[];
  isSettling: boolean;
};

export function BulkInput({
  value,
  onChange,
  disabled = false,
  maxDomains,
  validCount,
  invalidEntries,
  isSettling
}: BulkInputProps) {
  return (
    <label className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
          Domains
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="rounded-full border border-white/10 px-3 py-1">
            {validCount} valid / {maxDomains} max
          </span>
          {invalidEntries.length > 0 ? (
            <span className="rounded-full border border-rose-400/20 bg-rose-400/[0.06] px-3 py-1 text-rose-200">
              {invalidEntries.length} invalid
            </span>
          ) : null}
          {isSettling ? (
            <span className="rounded-full border border-sky-300/20 bg-sky-300/[0.06] px-3 py-1 text-sky-200">
              Parsing...
            </span>
          ) : null}
        </div>
      </div>

      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={"example.com\nopenai.com\ncloudflare.com"}
        suppressHydrationWarning
        className="field-shell min-h-[170px] rounded-[28px] px-5 py-4 text-base text-slate-100 outline-none transition duration-200 placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <span>Use one domain per line or comma-separated values.</span>
        {invalidEntries.length > 0 ? (
          <span className="max-w-xl text-right text-rose-200">
            Invalid entries: {invalidEntries.slice(0, 4).join(", ")}
            {invalidEntries.length > 4 ? "..." : ""}
          </span>
        ) : null}
      </div>
    </label>
  );
}
