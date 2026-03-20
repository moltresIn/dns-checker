import { RECORD_TYPES, type RecordType } from "@/lib/types";

type RecordTypeSelectProps = {
  value: RecordType;
  onChange: (value: RecordType) => void;
  disabled?: boolean;
};

export function RecordTypeSelect({
  value,
  onChange,
  disabled = false
}: RecordTypeSelectProps) {
  return (
    <label className="flex flex-col gap-3">
      <span className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
        Record Type
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as RecordType)}
        suppressHydrationWarning
        className="field-shell h-14 rounded-2xl px-4 text-base text-slate-100 outline-none transition duration-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {RECORD_TYPES.map((record) => (
          <option key={record} value={record} className="bg-slate-950">
            {record}
          </option>
        ))}
      </select>
    </label>
  );
}
