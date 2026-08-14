import neo4j from "neo4j-driver";

const { COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD } = process.env;

if (!COGNODB_URI || !COGNODB_USER || !COGNODB_PASSWORD) {
  console.error(
    "Missing credentials. Copy .env.example to .env and fill it in.",
  );
  process.exit(1);
}

// Fixed seed so every run produces an identical graph.
function random(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = random(20260814);

const pick = (items) => items[Math.floor(rand() * items.length)];
const pickMany = (items, count) => {
  const pool = [...items];
  const chosen = [];
  while (chosen.length < count && pool.length > 0) {
    chosen.push(...pool.splice(Math.floor(rand() * pool.length), 1));
  }
  return chosen;
};

const teams = [
  { id: "team-payments-platform", name: "Payments Platform", slug: "payments-platform" },
  { id: "team-risk-compliance", name: "Risk & Compliance", slug: "risk-compliance" },
  { id: "team-core-banking", name: "Core Banking", slug: "core-banking" },
  { id: "team-merchant-experience", name: "Merchant Experience", slug: "merchant-experience" },
  { id: "team-developer-platform", name: "Developer Platform", slug: "developer-platform" },
  { id: "team-data-platform", name: "Data Platform", slug: "data-platform" },
  { id: "team-infrastructure", name: "Infrastructure", slug: "infrastructure" },
  { id: "team-growth-engineering", name: "Growth Engineering", slug: "growth-engineering" },
];

const firstNames = [
  "Aarti", "Devan", "Priya", "Nikhil", "Sana", "Rohit", "Meera", "Kabir",
  "Ishaan", "Tara", "Vikram", "Leela", "Arjun", "Nadia", "Farhan", "Divya",
  "Omar", "Ritika", "Sameer", "Anika", "Yusuf", "Kavya", "Imran", "Pooja",
  "Rahul", "Nisha", "Ayaan", "Shreya", "Vivek", "Zoya", "Karan", "Anjali",
];

const surnames = [
  "Shah", "Menon", "Kulkarni", "Iyer", "Bose", "Nair", "Grewal", "Rao",
  "Sethi", "Banerjee", "Chowdhury", "Pillai", "Verma", "Kapoor", "Ahmed", "Joshi",
];

const datastores = [
  { id: "ds-payments-primary", name: "payments-primary", engine: "PostgreSQL", region: "ap-south-1" },
  { id: "ds-ledger-primary", name: "ledger-primary", engine: "PostgreSQL", region: "ap-south-1" },
  { id: "ds-session-cache", name: "session-cache", engine: "Redis", region: "ap-south-1" },
  { id: "ds-event-log", name: "event-log", engine: "Kafka", region: "ap-south-1" },
  { id: "ds-document-blobs", name: "document-blobs", engine: "S3", region: "ap-south-1" },
  { id: "ds-search-cluster", name: "search-cluster", engine: "Elasticsearch", region: "ap-south-1" },
  { id: "ds-analytics-warehouse", name: "analytics-warehouse", engine: "ClickHouse", region: "eu-west-1" },
  { id: "ds-config-store", name: "config-store", engine: "etcd", region: "ap-south-1" },
];

// Services are arranged in dependency layers: everything in a layer may depend
// on services below it, never above. This keeps the dependency graph acyclic
// and mirrors how a real platform is stratified.
const layers = [
  {
    tier: 3,
    names: [
      "postgres-proxy", "redis-cluster", "kafka-broker", "object-store",
      "service-mesh", "config-service", "secrets-manager", "feature-flags",
      "rate-limiter", "dns-resolver", "cert-manager", "log-shipper",
      "trace-collector", "job-queue",
    ],
    teams: ["team-infrastructure", "team-developer-platform"],
  },
  {
    tier: 2,
    names: [
      "identity", "session-store", "notifications", "webhooks", "scheduler",
      "search-index", "document-store", "event-bus", "metrics-pipeline",
      "email-relay", "sms-relay", "file-uploads", "pdf-renderer",
      "template-service", "entitlements", "audit-log", "workflow-engine",
      "i18n-service",
    ],
    teams: ["team-developer-platform", "team-data-platform", "team-infrastructure"],
  },
  {
    tier: 2,
    names: [
      "ledger", "pricing-engine", "fx-rates", "spend-limits", "kyc-service",
      "fraud-scoring", "card-issuing", "settlement", "disputes", "statements",
      "payouts", "refunds", "invoicing", "tax-engine", "rewards",
      "subscriptions", "risk-profile", "merchant-registry", "account-service",
      "transaction-history",
    ],
    teams: ["team-payments-platform", "team-risk-compliance", "team-core-banking"],
  },
  {
    tier: 1,
    names: [
      "checkout-api", "wallet-api", "transfers-api", "onboarding-api",
      "merchant-portal", "mobile-bff", "web-bff", "admin-console",
      "reporting-api", "partner-gateway", "statements-portal",
      "dispute-center", "card-controls", "payout-console",
    ],
    teams: ["team-merchant-experience", "team-growth-engineering", "team-payments-platform"],
  },
];

const descriptions = {
  1: "Customer-facing entry point. Downtime is visible to end users immediately.",
  2: "Internal domain service. Failures degrade one or more product surfaces.",
  3: "Shared infrastructure. Failures fan out across the whole estate.",
};

function buildEngineers() {
  const engineers = [];
  teams.forEach((team) => {
    for (let index = 0; index < 4; index += 1) {
      const first = firstNames[engineers.length % firstNames.length];
      const last = pick(surnames);
      engineers.push({
        id: `eng-${team.slug}-${index}`,
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
        teamId: team.id,
        role: index === 0 ? "on-call" : "member",
      });
    }
  });
  return engineers;
}

function buildServices() {
  const services = [];
  layers.forEach((layer, layerIndex) => {
    layer.names.forEach((name) => {
      services.push({
        id: name,
        name,
        tier: layer.tier,
        environment: "production",
        description: descriptions[layer.tier],
        layer: layerIndex,
        teamId: pick(layer.teams),
      });
    });
  });
  return services;
}

function buildDependencies(services) {
  const dependencies = [];
  const seen = new Set();

  services.forEach((service) => {
    if (service.layer === 0) return;

    const below = services.filter((other) => other.layer === service.layer - 1);
    const wellBelow = services.filter((other) => other.layer < service.layer - 1);

    const targets = [
      ...pickMany(below, 1 + Math.floor(rand() * 3)),
      ...(rand() < 0.45 ? pickMany(wellBelow, 1) : []),
    ];

    targets.forEach((target) => {
      const key = `${service.id}->${target.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      dependencies.push({
        source: service.id,
        target: target.id,
        criticality: rand() < 0.65 ? "hard" : "soft",
        protocol: pick(["http", "grpc", "kafka"]),
      });
    });
  });

  return dependencies;
}

function buildRuntimes(services) {
  return services
    .filter(() => rand() < 0.45)
    .map((service) => ({
      serviceId: service.id,
      datastoreId: pick(datastores).id,
    }));
}

function buildIncidents(services) {
  const titles = [
    "Elevated error rate", "Connection pool exhaustion", "Latency regression",
    "Failed deploy rollback", "Certificate expiry", "Disk pressure",
    "Cascading timeouts", "Partial region outage", "Message backlog",
    "Memory leak after release",
  ];

  const incidents = [];
  for (let index = 0; index < 30; index += 1) {
    const impacted = pickMany(services, 1 + Math.floor(rand() * 3));
    const startedAt = new Date(
      Date.UTC(2026, 4 + Math.floor(rand() * 3), 1 + Math.floor(rand() * 28), Math.floor(rand() * 24)),
    );
    const resolved = index >= 3;

    incidents.push({
      id: `inc-${String(index + 1).padStart(3, "0")}`,
      title: `${pick(titles)} on ${impacted[0].name}`,
      severity: 1 + Math.floor(rand() * 3),
      startedAt: startedAt.toISOString(),
      resolvedAt: resolved
        ? new Date(startedAt.getTime() + (1 + Math.floor(rand() * 8)) * 3600_000).toISOString()
        : null,
      impacted: impacted.map((service) => service.id),
    });
  }
  return incidents;
}

const CONSTRAINTS = [
  "CREATE CONSTRAINT service_id IF NOT EXISTS FOR (s:Service) REQUIRE s.id IS UNIQUE",
  "CREATE CONSTRAINT team_id IF NOT EXISTS FOR (t:Team) REQUIRE t.id IS UNIQUE",
  "CREATE CONSTRAINT engineer_id IF NOT EXISTS FOR (e:Engineer) REQUIRE e.id IS UNIQUE",
  "CREATE CONSTRAINT datastore_id IF NOT EXISTS FOR (d:Datastore) REQUIRE d.id IS UNIQUE",
  "CREATE CONSTRAINT incident_id IF NOT EXISTS FOR (i:Incident) REQUIRE i.id IS UNIQUE",
];

const LOAD_STEPS = [
  {
    label: "teams",
    cypher: `
      UNWIND $rows AS row
      MERGE (team:Team {id: row.id})
      SET team.name = row.name, team.slug = row.slug
    `,
  },
  {
    label: "engineers",
    cypher: `
      UNWIND $rows AS row
      MERGE (engineer:Engineer {id: row.id})
      SET engineer.name = row.name, engineer.email = row.email
      WITH engineer, row
      MATCH (team:Team {id: row.teamId})
      MERGE (team)-[membership:HAS_MEMBER]->(engineer)
      SET membership.role = row.role
    `,
  },
  {
    label: "datastores",
    cypher: `
      UNWIND $rows AS row
      MERGE (datastore:Datastore {id: row.id})
      SET datastore.name = row.name, datastore.engine = row.engine, datastore.region = row.region
    `,
  },
  {
    label: "services",
    cypher: `
      UNWIND $rows AS row
      MERGE (service:Service {id: row.id})
      SET service.name = row.name,
          service.tier = row.tier,
          service.environment = row.environment,
          service.description = row.description
      WITH service, row
      MATCH (team:Team {id: row.teamId})
      MERGE (service)-[:OWNED_BY]->(team)
    `,
  },
  {
    label: "dependencies",
    cypher: `
      UNWIND $rows AS row
      MATCH (source:Service {id: row.source})
      MATCH (target:Service {id: row.target})
      MERGE (source)-[dependency:DEPENDS_ON]->(target)
      SET dependency.criticality = row.criticality, dependency.protocol = row.protocol
    `,
  },
  {
    label: "runtimes",
    cypher: `
      UNWIND $rows AS row
      MATCH (service:Service {id: row.serviceId})
      MATCH (datastore:Datastore {id: row.datastoreId})
      MERGE (service)-[:RUNS_ON]->(datastore)
    `,
  },
  {
    label: "incidents",
    cypher: `
      UNWIND $rows AS row
      MERGE (incident:Incident {id: row.id})
      SET incident.title = row.title,
          incident.severity = row.severity,
          incident.startedAt = row.startedAt,
          incident.resolvedAt = row.resolvedAt
      WITH incident, row
      UNWIND row.impacted AS serviceId
      MATCH (service:Service {id: serviceId})
      MERGE (incident)-[:IMPACTED]->(service)
    `,
  },
];

async function main() {
  const services = buildServices();
  const dataset = {
    teams,
    engineers: buildEngineers(),
    datastores,
    services,
    dependencies: buildDependencies(services),
    runtimes: buildRuntimes(services),
    incidents: buildIncidents(services),
  };

  const driver = neo4j.driver(
    COGNODB_URI,
    neo4j.auth.basic(COGNODB_USER, COGNODB_PASSWORD),
  );

  try {
    await driver.getServerInfo();
    console.log(`Connected to ${COGNODB_URI}`);
  } catch (error) {
    console.error("Could not connect to CognoDB:", error.message);
    await driver.close();
    process.exit(1);
  }

  const session = driver.session();

  try {
    console.log("Clearing existing graph");
    await session.run("MATCH (node) DETACH DELETE node");

    for (const constraint of CONSTRAINTS) {
      await session.run(constraint);
    }

    for (const step of LOAD_STEPS) {
      const rows = dataset[step.label];
      await session.run(step.cypher, { rows });
      console.log(`Loaded ${rows.length} ${step.label}`);
    }

    const [summary] = (
      await session.run(`
        MATCH (node) WITH count(node) AS nodes
        MATCH ()-[edge]->() RETURN nodes, count(edge) AS relationships
      `)
    ).records;

    console.log(
      `Done: ${summary.get("nodes")} nodes, ${summary.get("relationships")} relationships`,
    );
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await session.close();
    await driver.close();
  }
}

main();
