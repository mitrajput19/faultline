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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* A plain GET form keeps search in the URL and working without JavaScript. */}
      <form action="/" className="w-full sm:max-w-xs">
        {tier ? <input type="hidden" name="tier" value={tier} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search services"
          aria-label="Search services"
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none"
        />
      </form>

      <div className="flex flex-wrap gap-2">
        {tiers.map((option) => {
          const active = option.value === tier;
          return (
            <Link
              key={option.label}
              href={tierHref(search, option.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-line bg-surface text-muted hover:text-ink"
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
