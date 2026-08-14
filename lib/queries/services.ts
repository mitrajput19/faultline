import { read } from "@/lib/db/driver";
import type { ServiceOverview, ServiceSummary } from "@/lib/types";

const LIST_SERVICES = `
MATCH (service:Service)-[:OWNED_BY]->(team:Team)
WHERE ($search = '' OR toLower(service.name) CONTAINS toLower($search))
  AND ($tier IS NULL OR service.tier = $tier)
OPTIONAL MATCH (incident:Incident)-[:IMPACTED]->(service)
  WHERE incident.resolvedAt IS NULL
RETURN service.id          AS id,
       service.name        AS name,
       service.tier        AS tier,
       service.environment AS environment,
       team.name           AS team,
       count(incident)     AS activeIncidents
ORDER BY service.tier, service.name
`;

const GET_SERVICE = `
MATCH (service:Service {id: $id})-[:OWNED_BY]->(team:Team)
OPTIONAL MATCH (team)-[membership:HAS_MEMBER]->(engineer:Engineer)
  WHERE membership.role = 'on-call'
OPTIONAL MATCH (service)-[:RUNS_ON]->(datastore:Datastore)
OPTIONAL MATCH (incident:Incident)-[:IMPACTED]->(service)
RETURN service.id                     AS id,
       service.name                   AS name,
       service.tier                   AS tier,
       service.environment            AS environment,
       service.description            AS description,
       team.name                      AS team,
       team.slug                      AS teamSlug,
       engineer.name                  AS onCall,
       engineer.email                 AS onCallEmail,
       collect(DISTINCT datastore.name) AS datastores,
       count(DISTINCT incident)       AS pastIncidents
`;

export function listServices(search: string, tier: number | null) {
  return read<ServiceSummary>(LIST_SERVICES, { search, tier });
}

export async function getService(id: string): Promise<ServiceOverview | null> {
  const [service] = await read<ServiceOverview>(GET_SERVICE, { id });
  return service ?? null;
}
