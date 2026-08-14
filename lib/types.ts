export type Tier = 1 | 2 | 3;

export type ServiceSummary = {
  id: string;
  name: string;
  tier: Tier;
  environment: string;
  team: string;
  activeIncidents: number;
};

export type ServiceOverview = {
  id: string;
  name: string;
  tier: Tier;
  environment: string;
  description: string;
  team: string;
  teamSlug: string;
  onCall: string | null;
  onCallEmail: string | null;
  datastores: string[];
  pastIncidents: number;
};

export type ImpactedService = {
  id: string;
  name: string;
  tier: Tier;
  hops: number;
  certain: boolean;
  team: string;
  onCall: string | null;
  onCallEmail: string | null;
};

export type DependencyEdge = {
  source: string;
  target: string;
  criticality: "hard" | "soft";
};

export type BlastRadius = {
  origin: ServiceOverview;
  impacted: ImpactedService[];
  edges: DependencyEdge[];
};
