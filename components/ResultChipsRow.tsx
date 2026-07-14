"use client";

import { Badge } from "@/components/animate-ui/components/display/badge";
import { Box } from "@/components/animate-ui/components/layout/box";
import { Text } from "@/components/animate-ui/components/typography/text";
import { computeResultChips } from "@/lib/consensus";
import type { ResolverMapNode } from "@/lib/types";

type ResultChipsRowProps = {
  results: ResolverMapNode[];
  expectedValue?: string | null;
};

export function ResultChipsRow({
  results,
  expectedValue
}: ResultChipsRowProps) {
  const chips = computeResultChips(results, expectedValue);

  return (
    <Box className="flex flex-wrap gap-2">
      <Badge size="lg" className="normal-case tracking-normal">
        Distinct{" "}
        <Text as="span" className="ml-1 inline font-semibold text-white">
          {chips.distinct}
        </Text>
      </Badge>
      <Badge variant="emerald" size="lg" className="normal-case tracking-normal">
        Consensus{" "}
        <Text as="span" className="ml-1 inline font-semibold text-white">
          {chips.consensus}
        </Text>
      </Badge>
      <Badge variant="sky" size="lg" className="normal-case tracking-normal">
        Pending{" "}
        <Text as="span" className="ml-1 inline font-semibold text-white">
          {chips.pending}
        </Text>
      </Badge>
      <Badge variant="danger" size="lg" className="normal-case tracking-normal">
        Failed{" "}
        <Text as="span" className="ml-1 inline font-semibold text-white">
          {chips.failed}
        </Text>
      </Badge>
    </Box>
  );
}
