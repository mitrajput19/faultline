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
    <div className="space-y-8">
      <section className="rounded-xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{origin.name}</h1>
          <TierBadge tier={origin.tier} />
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {origin.description}
        </p>

        <dl className="mt-6 grid gap-6 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-4">
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
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Services affected" value={impacted.length} />
            <Stat label="Certain outage" value={certain.length} tone="critical" />
            <Stat label="Tier 1 affected" value={frontline.length} tone="degraded" />
            <Stat label="Teams to notify" value={teams.size} />
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Impact graph
              </h2>
              <Legend />
            </div>
            <ImpactGraph origin={origin} impacted={impacted} edges={edges} />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Who to page
            </h2>
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th className="px-4 py-3 font-medium">Distance</th>
                    <th className="px-4 py-3 font-medium">Impact</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Team</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">On call</th>
                  </tr>
                </thead>
                <tbody>
                  {impacted.map((service) => (
                    <tr key={service.id} className="border-t border-line">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{service.name}</span>
                          <TierBadge tier={service.tier} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {service.hops} hop{service.hops > 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            service.certain
                              ? "text-xs font-medium text-critical"
                              : "text-xs font-medium text-degraded"
                          }
                        >
                          {service.certain ? "Certain outage" : "Degraded"}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-muted sm:table-cell">
                        {service.team}
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        {service.onCall ? (
                          <a
                            href={`mailto:${service.onCallEmail}`}
                            className="text-accent hover:underline"
                          >
                            {service.onCall}
                          </a>
                        ) : (
                          <span className="text-muted/70">Unassigned</span>
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
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
      {hint ? <dd className="text-xs text-muted">{hint}</dd> : null}
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
  tone?: "critical" | "degraded";
}) {
  const colour =
    tone === "critical"
      ? "text-critical"
      : tone === "degraded"
        ? "text-degraded"
        : "text-ink";

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${colour}`}>
        {value}
      </p>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-sm bg-accent" /> Origin
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-sm bg-critical" /> Certain outage
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-sm bg-muted" /> Degraded
      </span>
      <span>Arrows point to the dependency a service needs</span>
    </div>
  );
}
