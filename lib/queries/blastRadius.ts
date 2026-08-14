import { read } from "@/lib/db/driver";
import type { DependencyEdge, ImpactedService } from "@/lib/types";

/**
 * Cypher requires literal bounds on a variable-length pattern, so the pattern
 * is fixed at the widest depth the UI offers and the caller's depth is applied
 * as a parameterised predicate on the path length.
 */
export const MAX_DEPTH = 4;
export const DEPTH_OPTIONS = [1, 2, 3, 4] as const;

const BLAST_RADIUS = `
MATCH path = (impacted:Service)-[:DEPENDS_ON*1..4]->(origin:Service {id: $id})
WHERE length(path) <= $depth AND impacted <> origin
WITH impacted,
     min(length(path)) AS hops,
     collect(path)     AS paths
WITH impacted, hops,
     any(p IN paths
         WHERE all(edge IN relationships(p) WHERE edge.criticality = 'hard')) AS certain
MATCH (impacted)-[:OWNED_BY]->(team:Team)
OPTIONAL MATCH (team)-[membership:HAS_MEMBER]->(engineer:Engineer)
  WHERE membership.role = 'on-call'
RETURN impacted.id   AS id,
       impacted.name AS name,
       impacted.tier AS tier,
       hops,
       certain,
       team.name      AS team,
       engineer.name  AS onCall,
       engineer.email AS onCallEmail
ORDER BY certain DESC, hops, impacted.tier, impacted.name
`;

const DEPENDENCY_EDGES = `
MATCH (source:Service)-[edge:DEPENDS_ON]->(target:Service)
WHERE source.id IN $ids AND target.id IN $ids
RETURN source.id      AS source,
       target.id      AS target,
       edge.criticality AS criticality
`;

export function getImpactedServices(id: string, depth: number) {
  return read<ImpactedService>(BLAST_RADIUS, { id, depth });
}

export function getDependencyEdges(ids: string[]) {
  return read<DependencyEdge>(DEPENDENCY_EDGES, { ids });
}
