import Link from "next/link";
import { DatabaseUnavailableError } from "@/lib/db/driver";
import { listServices } from "@/lib/queries/services";
import { DatabaseError } from "@/components/DatabaseError";
import { EmptyState } from "@/components/EmptyState";
import { TierBadge } from "@/components/TierBadge";

export async function ServiceTable({
  search,
  tier,
}: {
  search: string;
  tier: number | null;
}) {
  let services;

  try {
    services = await listServices(search, tier);
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return <DatabaseError detail={error.message} />;
    }
    throw error;
  }

  if (services.length === 0) {
    return (
      <EmptyState
        title="No services match those filters"
        description="Try a different search term, or clear the tier filter to see the full estate."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-soft border border-hairline bg-surface">
      <table className="w-full border-collapse text-body-md">
        <thead>
          <tr className="border-b border-hairline text-left text-caption-sm text-subtle">
            <th className="px-4 py-3 font-medium">Service</th>
            <th className="px-4 py-3 font-medium">Tier</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Owner</th>
            <th className="px-4 py-3 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id} className="border-b border-hairline transition-colors last:border-0 hover:bg-parchment">
              <td className="px-4 py-3">
                <Link
                  href={`/services/${service.id}`}
                  className="rounded-sharp font-semibold text-ink underline decoration-hairline underline-offset-4 hover:text-accent hover:decoration-accent"
                >
                  {service.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                <TierBadge tier={service.tier} />
              </td>
              <td className="hidden px-4 py-3 text-caption-sm text-subtle sm:table-cell">
                {service.team}
              </td>
              <td className="px-4 py-3 text-right text-caption-sm">
                {service.activeIncidents > 0 ? (
                  <span className="font-medium text-critical">
                    {service.activeIncidents} active incident
                    {service.activeIncidents > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-subtle">Healthy</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
