import type { Tier } from "@/lib/types";

const styles: Record<Tier, string> = {
  1: "border-critical text-critical",
  2: "border-warning text-warning",
  3: "border-hairline text-subtle",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-caption-sm font-medium ${styles[tier]}`}
    >
      Tier {tier}
    </span>
  );
}
