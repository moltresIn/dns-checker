type DomainInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function DomainInput({ value, onChange, disabled = false }: DomainInputProps) {
  return (
    <label className="flex flex-col gap-3">
      <span className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
        Domain
      </span>
      <input
        type="text"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        placeholder="example.com"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        suppressHydrationWarning
        className="field-shell h-14 rounded-2xl px-4 text-base text-slate-100 outline-none transition duration-200 placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}
