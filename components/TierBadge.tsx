import type { Tier } from "@/lib/types";

const styles: Record<Tier, string> = {
  1: "border-critical text-critical",
  2: "border-warning text-warning",
  3: "border-hairline text-subtle",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`inline-flex items-center rounded-sharp border px-2 py-0.5 text-caption-sm font-medium ${styles[tier]}`}
    >
      Tier {tier}
    </span>
  );
}
