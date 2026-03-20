import type {
  ResolverDefinition,
  ResolverFilterOptions,
  ResolverFilters,
  ResolverMapNode
} from "@/lib/types";

export const EMPTY_FILTERS: ResolverFilters = {
  search: "",
  providers: [],
  regions: [],
  countries: []
};

function sortValues(values: string[]) {
  return values.slice().sort((left, right) => left.localeCompare(right));
}

export function getResolverFilterOptions(resolvers: ResolverDefinition[]): ResolverFilterOptions {
  return {
    providers: sortValues(Array.from(new Set(resolvers.map((resolver) => resolver.provider)))),
    regions: sortValues(Array.from(new Set(resolvers.map((resolver) => resolver.region)))),
    countries: sortValues(Array.from(new Set(resolvers.map((resolver) => resolver.country))))
  };
}

export function hasActiveFilters(filters: ResolverFilters) {
  return (
    filters.search.trim().length > 0 ||
    filters.providers.length > 0 ||
    filters.regions.length > 0 ||
    filters.countries.length > 0
  );
}

export function matchesResolverFilters(resolver: ResolverDefinition, filters: ResolverFilters) {
  const normalizedQuery = filters.search.trim().toLowerCase();
  const matchesSearch =
    normalizedQuery.length === 0 ||
    [
      resolver.resolver,
      resolver.provider,
      resolver.region,
      resolver.country,
      resolver.city,
      resolver.location,
      resolver.server
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);

  const matchesProvider =
    filters.providers.length === 0 || filters.providers.includes(resolver.provider);
  const matchesRegion = filters.regions.length === 0 || filters.regions.includes(resolver.region);
  const matchesCountry =
    filters.countries.length === 0 || filters.countries.includes(resolver.country);

  return matchesSearch && matchesProvider && matchesRegion && matchesCountry;
}

export function applyResolverFilters(
  resolvers: ResolverMapNode[],
  filters: ResolverFilters
): ResolverMapNode[] {
  return resolvers.map((resolver) => ({
    ...resolver,
    matched: matchesResolverFilters(resolver, filters)
  }));
}

export function filterResolverNodes(resolvers: ResolverMapNode[], filters: ResolverFilters) {
  return applyResolverFilters(resolvers, filters).filter((resolver) => resolver.matched);
}
