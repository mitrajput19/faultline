import Link from "next/link";

const tiers = [
  { value: null, label: "All tiers" },
  { value: 1, label: "Tier 1" },
  { value: 2, label: "Tier 2" },
  { value: 3, label: "Tier 3" },
];

function tierHref(search: string, tier: number | null) {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (tier) params.set("tier", String(tier));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function ServiceFilters({
  search,
  tier,
}: {
  search: string;
  tier: number | null;
}) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      {/* A plain GET form keeps search in the URL and working without JavaScript. */}
      <form action="/" className="w-full md:max-w-sm">
        {tier ? <input type="hidden" name="tier" value={tier} /> : null}
        <label
          htmlFor="service-search"
          className="block text-caption-sm font-semibold text-ink"
        >
          Search
        </label>
        <input
          id="service-search"
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Service name"
          className="mt-2 h-11 w-full rounded-full border border-hairline bg-surface px-5 text-body-md text-ink placeholder:text-subtle focus:border-accent focus:outline-none"
        />
      </form>

      <div className="flex flex-wrap gap-2">
        {tiers.map((option) => {
          const active = option.value === tier;
          return (
            <Link
              key={option.label}
              href={tierHref(search, option.value)}
              aria-current={active ? "true" : undefined}
              className={`rounded-full border px-4 py-2.5 text-caption-sm font-medium transition-colors ${
                active
                  ? "border-accent bg-accent text-on-accent"
                  : "border-hairline bg-surface text-subtle hover:border-accent hover:text-ink"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
