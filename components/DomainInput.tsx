import { Field, FieldLabel } from "@/components/animate-ui/components/form/field";
import { Input } from "@/components/animate-ui/components/form/input";

type DomainInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function DomainInput({ value, onChange, disabled = false }: DomainInputProps) {
  return (
    <Field>
      <FieldLabel uppercase>Domain</FieldLabel>
      <Input
        type="text"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        placeholder="example.com"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        suppressHydrationWarning
      />
    </Field>
  );
}
