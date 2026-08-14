# Faultline

Dependency blast-radius for incident response, backed by [CognoDB](https://console.cognodb.com).

When a service starts failing, the first two questions in the incident channel are always the same: **what else is going to break, and who do I need to page?** Faultline answers both from a single graph traversal.

- **Live demo:** [Faultline](https://faultline-lemon.vercel.app/)
- **Screen recording:** [Google Drive Link](https://drive.google.com/drive/folders/1Dsi3oN3cTXQ1UO1k4Q1rwRwj76QUUp_O?usp=sharing)

---

## The use case

A platform of a hundred-odd services is a directed graph of dependencies, not a list of rows. `checkout-api` needs `ledger`, `ledger` needs `postgres-proxy`. When `postgres-proxy` degrades, the outage travels _upstream_ along those edges, and the set of teams that need to be involved is discovered by walking the same edges into ownership.

Faultline models that estate and answers one question well:

> Given a service that has started failing, which other services are in the blast radius, how certain is each one to fail, and who is on call for it?

The application deliberately does one thing. There is no CRUD, no auth and no catch-all dashboard: an on-call engineer opens a service, sees the impact cone, and gets a paging list.

### Certain outage vs. degraded

Every `DEPENDS_ON` edge carries a `criticality` of `hard` or `soft`. A hard dependency means the caller cannot function without it; a soft one means the caller degrades but survives.

That distinction is a property of the **relationship**, not of either service — `checkout-api` needing `ledger` is critical, while `checkout-api` needing `rewards` is not, and neither fact belongs on a service row. Because it lives on the edge, the traversal can grade the result: a downstream service is reported as a **certain outage** only if there exists a path back to the origin on which _every_ edge is hard. Otherwise it is **degraded**.

This is what turns a flat list of "things connected to X" into an actionable page-list.

---

## Why a graph database?

The core query is: _find every service that can reach this one through one to four `DEPENDS_ON` edges, and for each, decide whether some path to it is hard the whole way._

In a relational schema that is a recursive CTE over a `service_dependencies` join table. It works, but three things hurt:

1. **Depth is not free.** Each extra hop is another round of the recursion against an ever-growing intermediate result. Traversal in a graph database follows pointers between stored records, so cost tracks the size of the neighbourhood actually visited rather than the size of the table.
2. **The interesting predicate is over a path, not a row.** "Every edge along this route is hard" has no natural relational expression — you have to materialise paths as arrays inside the recursive term and post-filter them. In Cypher it is one clause:
   `all(edge IN relationships(p) WHERE edge.criticality = 'hard')`.
3. **The traversal changes relationship type midway.** After walking `DEPENDS_ON` an arbitrary number of times, the same query pivots onto `OWNED_BY` and then `HAS_MEMBER` to resolve the on-call engineer. Relationally that is a recursive CTE joined against three more tables; in the graph it is three more pattern segments in the same statement.

The dataset is not large. The reason for a graph database here is not volume, it is that **the questions are about paths**, and paths are what this model stores natively.

---

## Data model

```mermaid
graph LR
  S["Service<br/>id · name · tier · environment · description"]
  T["Team<br/>id · name · slug"]
  E["Engineer<br/>id · name · email"]
  D["Datastore<br/>id · name · engine · region"]
  I["Incident<br/>id · title · severity · startedAt · resolvedAt"]

  S -->|"DEPENDS_ON<br/>criticality · protocol"| S
  S -->|OWNED_BY| T
  S -->|RUNS_ON| D
  T -->|"HAS_MEMBER<br/>role"| E
  I -->|IMPACTED| S
```

| Node        | Meaning                                                                         |
| ----------- | ------------------------------------------------------------------------------- |
| `Service`   | A deployable unit. `tier` is 1 (customer-facing) to 3 (shared infrastructure).  |
| `Team`      | The group that owns one or more services.                                       |
| `Engineer`  | A person. Reached through `HAS_MEMBER`, whose `role` marks the current on-call. |
| `Datastore` | Backing storage a service runs on.                                              |
| `Incident`  | A past or ongoing incident. `resolvedAt` is null while it is open.              |

### Direction matters

`(a)-[:DEPENDS_ON]->(b)` reads _a needs b_. Failure therefore propagates in the **opposite** direction to the arrow, which is why the blast-radius query traverses the edge backwards:

```cypher
MATCH path = (impacted:Service)-[:DEPENDS_ON*1..4]->(origin:Service {id: $id})
```

`impacted` is bound to everything that can reach the origin — that is precisely the set that breaks when the origin does.

---

## The queries

All Cypher lives in [`lib/queries`](lib/queries). Every value is passed as a `$parameter`; no query is built by string concatenation.

### 1. Service catalogue

[`lib/queries/services.ts`](lib/queries/services.ts) — search and tier filter, with a count of open incidents per service. Both filters are parameterised and made optional inside the query (`$search = '' OR ...`), so one statement serves every combination of filters instead of four assembled variants.


### 2. Install and seed

```bash
npm install
npm run seed
```

The seed script clears the graph, creates uniqueness constraints, and loads the dataset with batched `UNWIND` statements. It is deterministic — the same graph is produced on every run.

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## The dataset

Generated by [`scripts/seed.mjs`](scripts/seed.mjs): 66 services, 8 teams, 32 engineers, 8 datastores and 30 incidents, joined by roughly 400 relationships.

Services are laid out in four dependency layers — infrastructure, platform, domain, product — and only ever depend downwards, which keeps the graph acyclic and mirrors how a real platform is stratified. Dependency criticality, ownership and incident history are drawn from a fixed-seed PRNG so the demo is reproducible.

The size is chosen for legibility rather than scale: a blast radius of a few dozen services is something a human can actually read, and it sits comfortably inside the free instance's 256 MB.

---

## Project structure

```
app/
  layout.tsx              shell, typography, navigation
  page.tsx                service catalogue
  services/[id]/page.tsx  blast radius, depth selector
components/               presentation only
lib/
  db/driver.ts            pooled driver, configuration, error translation
  queries/                every Cypher statement in the codebase
  types.ts                shapes returned by the queries
scripts/seed.mjs          data loader
```

Three conventions hold the codebase together:

- **All Cypher lives in `lib/queries`.** Nothing else in the application constructs a query, so the full set of statements can be reviewed in one folder.
- **Components never touch the driver directly.** They call a named query function, which keeps rendering free of database concerns.
- **Data is fetched in server components.** Pages await the query inside a `Suspense` boundary, which is what produces the loading state; there are no client-side fetches and no API layer that would only ever be called by this application.

### Error handling

`lib/db/driver.ts` translates every failure mode — missing configuration, DNS or TLS failure, bad credentials, timeout — into a single `DatabaseUnavailableError`. Components catch it and render a recoverable panel explaining that the instance is unreachable. Stopping the CognoDB instance degrades the application into that state rather than a stack trace.

### Dependencies

Runtime dependencies are `next`, `react`, `react-dom` and `neo4j-driver`. There is no charting or graph-drawing library: the impact graph is inline SVG laid out by hop distance, because horizontal position carrying the meaning of "how far from the origin" is more useful here than anything a force-directed layout would produce. Search state lives in the URL rather than a state library, which also makes any view shareable into an incident channel.

---

## Screenshots

![alt text](image.png)

![alt text](image-4.png)

![alt text](image-1.png)

![alt text](image-3.png)
