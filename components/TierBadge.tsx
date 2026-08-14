import type { Tier } from "@/lib/types";

const styles: Record<Tier, string> = {
  1: "border-critical/40 bg-critical/10 text-critical",
  2: "border-degraded/40 bg-degraded/10 text-degraded",
  3: "border-line bg-raised text-muted",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[tier]}`}
    >
      Tier {tier}
    </span>
  );
}
