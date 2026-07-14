import { Badge } from "@/components/animate-ui/components/display/badge";
import { Box } from "@/components/animate-ui/components/layout/box";
import {
  Field,
  FieldHint,
  FieldLabel
} from "@/components/animate-ui/components/form/field";
import { Textarea } from "@/components/animate-ui/components/form/textarea";
import { Text } from "@/components/animate-ui/components/typography/text";

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
    <Field>
      <Box className="flex flex-wrap items-center justify-between gap-3">
        <FieldLabel uppercase>Domains</FieldLabel>
        <Box className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <Badge size="lg" className="normal-case">
            {validCount} valid / {maxDomains} max
          </Badge>
          {invalidEntries.length > 0 ? (
            <Badge variant="danger" size="lg" className="normal-case">
              {invalidEntries.length} invalid
            </Badge>
          ) : null}
          {isSettling ? (
            <Badge variant="connecting" size="lg" className="normal-case">
              Parsing...
            </Badge>
          ) : null}
        </Box>
      </Box>

      <Textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={"example.com\nopenai.com\ncloudflare.com"}
        suppressHydrationWarning
      />

      <Box className="flex flex-wrap items-center justify-between gap-3">
        <FieldHint>Use one domain per line or comma-separated values.</FieldHint>
        {invalidEntries.length > 0 ? (
          <Text as="span" className="max-w-xl text-right text-rose-200">
            Invalid entries: {invalidEntries.slice(0, 4).join(", ")}
            {invalidEntries.length > 4 ? "..." : ""}
          </Text>
        ) : null}
      </Box>
    </Field>
  );
}
