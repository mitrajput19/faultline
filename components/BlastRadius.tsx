import { notFound } from "next/navigation";
import { DatabaseUnavailableError } from "@/lib/db/driver";
import { getDependencyEdges, getImpactedServices } from "@/lib/queries/blastRadius";
import { getService } from "@/lib/queries/services";
import { DatabaseError } from "@/components/DatabaseError";
import { EmptyState } from "@/components/EmptyState";
import { ImpactGraph } from "@/components/ImpactGraph";
import { TierBadge } from "@/components/TierBadge";
import type { BlastRadius as BlastRadiusData } from "@/lib/types";

async function loadBlastRadius(
  id: string,
  depth: number,
): Promise<BlastRadiusData | null> {
  const origin = await getService(id);
  if (!origin) return null;

  const impacted = await getImpactedServices(id, depth);
  const edges = await getDependencyEdges([
    origin.id,
    ...impacted.map((service) => service.id),
  ]);

  return { origin, impacted, edges };
}

export async function BlastRadius({
  id,
  depth,
}: {
  id: string;
  depth: number;
}) {
  let data: BlastRadiusData | null;

  try {
    data = await loadBlastRadius(id, depth);
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return <DatabaseError detail={error.message} />;
    }
    throw error;
  }

  if (!data) notFound();

  const { origin, impacted, edges } = data;
  const certain = impacted.filter((service) => service.certain);
  const frontline = impacted.filter((service) => service.tier === 1);
  const teams = new Set(impacted.map((service) => service.team));

  return (
    <div className="space-y-16">
      <section className="border-b border-hairline pb-12">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-display-sm font-bold">{origin.name}</h1>
          <TierBadge tier={origin.tier} />
        </div>
        <p className="mt-3 max-w-2xl text-body-md text-subtle">
          {origin.description}
        </p>

        <dl className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Owning team" value={origin.team} />
          <Fact
            label="On call"
            value={origin.onCall ?? "Unassigned"}
            hint={origin.onCallEmail ?? undefined}
          />
          <Fact
            label="Datastores"
            value={origin.datastores.length > 0 ? origin.datastores.join(", ") : "None"}
          />
          <Fact label="Past incidents" value={String(origin.pastIncidents)} />
        </dl>
      </section>

      {impacted.length === 0 ? (
        <EmptyState
          title="Nothing depends on this service"
          description="No other service reaches this one within the selected depth, so an outage here stays contained."
        />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Services affected" value={impacted.length} />
            <Stat label="Certain outage" value={certain.length} tone="critical" />
            <Stat label="Tier 1 affected" value={frontline.length} tone="warning" />
            <Stat label="Teams to notify" value={teams.size} />
          </section>

          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-heading-md font-bold">Impact graph</h2>
              <Legend />
            </div>
            <div className="mt-6">
              <ImpactGraph origin={origin} impacted={impacted} edges={edges} />
            </div>
          </section>

          <section>
            <h2 className="text-heading-md font-bold">Who to page</h2>
            <div className="mt-6 overflow-x-auto rounded-soft border border-hairline bg-surface shadow-ambient">
              <table className="w-full border-collapse text-body-md">
                <thead>
                  <tr className="border-b border-hairline text-left text-caption-sm text-subtle">
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th className="px-4 py-3 font-medium">Distance</th>
                    <th className="px-4 py-3 font-medium">Impact</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Team</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">On call</th>
                  </tr>
                </thead>
                <tbody>
                  {impacted.map((service) => (
                    <tr
                      key={service.id}
                      className="border-b border-hairline last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{service.name}</span>
                          <TierBadge tier={service.tier} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-caption-sm text-subtle">
                        {service.hops} hop{service.hops > 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3 text-caption-sm">
                        <span
                          className={
                            service.certain
                              ? "font-medium text-critical"
                              : "font-medium text-warning"
                          }
                        >
                          {service.certain ? "Certain outage" : "Degraded"}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-caption-sm text-subtle sm:table-cell">
                        {service.team}
                      </td>
                      <td className="hidden px-4 py-3 text-caption-sm md:table-cell">
                        {service.onCall ? (
                          <a
                            href={`mailto:${service.onCallEmail}`}
                            className="rounded-sharp text-ink underline decoration-hairline underline-offset-4 hover:decoration-accent"
                          >
                            {service.onCall}
                          </a>
                        ) : (
                          <span className="text-subtle">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Fact({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="text-caption-sm text-subtle">{label}</dt>
      <dd className="mt-1 text-body-md font-medium text-ink">{value}</dd>
      {hint ? <dd className="text-caption-sm text-subtle">{hint}</dd> : null}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "critical" | "warning";
}) {
  const colour =
    tone === "critical"
      ? "text-critical"
      : tone === "warning"
        ? "text-warning"
        : "text-ink";

  return (
    <div className="rounded-soft border border-hairline bg-surface p-6 shadow-ambient">
      <p className="text-caption-sm text-subtle">{label}</p>
      <p className={`mt-4 text-display-sm font-bold tabular-nums ${colour}`}>
        {value}
      </p>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-caption-sm text-subtle">
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sharp bg-accent" /> Origin
      </span>
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sharp bg-critical" /> Certain outage
      </span>
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sharp border border-hairline" /> Degraded
      </span>
      <span>Arrows point to the dependency a service needs</span>
    </div>
  );
}
