import type { ResolverFilterOptions, ResolverFilters } from "@/lib/types";

type FilterGroupKey = "providers" | "regions" | "countries";

type ResolverFiltersProps = {
  filters: ResolverFilters;
  options: ResolverFilterOptions;
  matchedCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onSelectionChange: (key: FilterGroupKey, values: string[]) => void;
  onResetFilters: () => void;
};

type FilterGroupProps = {
  label: string;
  filterKey: FilterGroupKey;
  options: string[];
  selected: string[];
  onSelectionChange: (key: FilterGroupKey, values: string[]) => void;
};

function FilterGroup({
  label,
  filterKey,
  options,
  selected,
  onSelectionChange
}: FilterGroupProps) {
  return (
    <div className="panel-muted rounded-[24px] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
            {selected.length} selected
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <button
            type="button"
            onClick={() => onSelectionChange(filterKey, options)}
            suppressHydrationWarning
            className="rounded-full border border-white/10 px-3 py-1.5 transition hover:border-sky-300/30 hover:text-white"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => onSelectionChange(filterKey, [])}
            suppressHydrationWarning
            className="rounded-full border border-white/10 px-3 py-1.5 transition hover:border-rose-300/30 hover:text-white"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="subtle-scrollbar mt-4 flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
        {options.map((option) => {
          const isSelected = selected.includes(option);

          return (
            <label
              key={option}
              className={[
                "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm transition",
                isSelected
                  ? "border-sky-300/40 bg-sky-300/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:text-white"
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() =>
                  onSelectionChange(
                    filterKey,
                    isSelected
                      ? selected.filter((item) => item !== option)
                      : [...selected, option]
                  )
                }
                suppressHydrationWarning
                className="sr-only"
              />
              <span
                className={[
                  "h-2.5 w-2.5 rounded-full transition",
                  isSelected ? "bg-sky-300" : "bg-slate-600"
                ].join(" ")}
              />
              {option}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function ResolverFilters({
  filters,
  options,
  matchedCount,
  totalCount,
  onSearchChange,
  onSelectionChange,
  onResetFilters
}: ResolverFiltersProps) {
  return (
    <section className="glass-panel rounded-[32px] p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Resolver Filters</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50">Narrow the resolver set</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Filter by provider, region, country, or search terms. The table and globe update from
            the same filter state, so both views stay aligned.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="metric-card rounded-2xl px-4 py-3 text-sm text-slate-300">
            Showing <span className="font-semibold text-white">{matchedCount}</span> of{" "}
            <span className="font-semibold text-white">{totalCount}</span> resolvers
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            suppressHydrationWarning
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="mt-6">
        <label className="flex flex-col gap-3">
          <span className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
            Search
          </span>
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by resolver, provider, country, region, city, or server"
            suppressHydrationWarning
            className="field-shell h-14 rounded-2xl px-4 text-base text-slate-100 outline-none transition duration-200 placeholder:text-slate-500"
          />
        </label>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <FilterGroup
          label="Provider"
          filterKey="providers"
          options={options.providers}
          selected={filters.providers}
          onSelectionChange={onSelectionChange}
        />
        <FilterGroup
          label="Region"
          filterKey="regions"
          options={options.regions}
          selected={filters.regions}
          onSelectionChange={onSelectionChange}
        />
        <FilterGroup
          label="Country"
          filterKey="countries"
          options={options.countries}
          selected={filters.countries}
          onSelectionChange={onSelectionChange}
        />
      </div>
    </section>
  );
}
