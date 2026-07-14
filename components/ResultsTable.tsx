import { Box } from "@/components/animate-ui/components/layout/box";
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle
} from "@/components/animate-ui/components/layout/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/animate-ui/components/data/table";
import { Eyebrow, Text } from "@/components/animate-ui/components/typography/text";
import { StatusBadge } from "@/components/StatusBadge";
import type { ResolverResult } from "@/lib/types";

type ResultsTableProps = {
  results: ResolverResult[];
  loading: boolean;
  hasChecked: boolean;
  hasActiveFilters: boolean;
};

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow key={index} className="border-t border-white/5">
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <TableCell key={cellIndex}>
              <Box className="h-4 animate-pulse rounded-full bg-white/10" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function ResultsTable({
  results,
  loading,
  hasChecked,
  hasActiveFilters
}: ResultsTableProps) {
  const hasResults = results.length > 0;

  return (
    <Panel className="overflow-hidden rounded-[28px]">
      <PanelHeader>
        <Box className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <PanelContent>
            <Eyebrow className="tracking-[0.3em]">Resolver Results</Eyebrow>
            <PanelTitle className="mt-2">Propagation snapshot</PanelTitle>
          </PanelContent>
          <PanelDescription className="max-w-xl">
            Each resolver is queried independently so you can compare returned values, failures,
            and response times side by side.
          </PanelDescription>
        </Box>
      </PanelHeader>

      <Box className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-white/[0.03]">
            <TableRow>
              <TableHead>Resolver</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Geography</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <LoadingRows />
            ) : hasResults ? (
              results.map((result) => (
                <TableRow key={result.id} className="border-t border-white/5">
                  <TableCell>
                    <Text className="font-medium text-slate-100">{result.resolver}</Text>
                    <Text as="span" className="mt-1 block font-mono text-xs text-slate-500">
                      {result.server}
                    </Text>
                  </TableCell>
                  <TableCell className="text-slate-300">{result.provider}</TableCell>
                  <TableCell className="text-slate-300">
                    <Box>{result.location}</Box>
                    <Text as="span" className="mt-1 block text-xs uppercase tracking-[0.2em] text-slate-500">
                      {result.region}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text
                      as="span"
                      className="block max-w-md break-words font-mono text-xs leading-6 text-slate-200"
                    >
                      {result.value}
                    </Text>
                    {result.error ? (
                      <Text as="span" className="mt-2 block text-xs text-rose-300/90">
                        {result.error}
                      </Text>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={result.status} isMock={result.isMock} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-300">
                    {result.time} ms
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-14 text-center text-slate-400">
                  {hasChecked
                    ? hasActiveFilters
                      ? "No resolver results match the current filters."
                      : "The lookup completed without any displayable resolver results."
                    : "Run a lookup to see resolver responses here."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Panel>
  );
}
