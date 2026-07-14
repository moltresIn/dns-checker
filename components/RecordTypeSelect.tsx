import { Field, FieldLabel } from "@/components/animate-ui/components/form/field";
import { SelectMenu } from "@/components/animate-ui/components/form/select-menu";
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
    <Field>
      <FieldLabel uppercase>Record Type</FieldLabel>
      <SelectMenu
        value={value}
        disabled={disabled}
        aria-label="Record type"
        onChange={(nextValue) => onChange(nextValue as RecordType)}
        options={RECORD_TYPES.map((record) => ({
          value: record,
          label: record
        }))}
      />
    </Field>
  );
}
