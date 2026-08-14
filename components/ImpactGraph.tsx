import type { DependencyEdge, ImpactedService, ServiceOverview } from "@/lib/types";

const NODE_WIDTH = 170;
const NODE_HEIGHT = 36;
const COLUMN_STEP = 260;
const ROW_STEP = 50;
const PADDING = 28;
const HEADER_HEIGHT = 34;
const MAX_PER_COLUMN = 10;

type Placed = {
  id: string;
  name: string;
  x: number;
  y: number;
  tone: "origin" | "certain" | "degraded";
  detail: string;
};

/**
 * Services are laid out in columns by hop distance from the origin, so
 * horizontal position carries the meaning that a force-directed layout would
 * hide. Arrows follow the real DEPENDS_ON direction: they point from a service
 * to the dependency it needs.
 */
export function ImpactGraph({
  origin,
  impacted,
  edges,
}: {
  origin: ServiceOverview;
  impacted: ImpactedService[];
  edges: DependencyEdge[];
}) {
  const depths = Math.max(...impacted.map((service) => service.hops), 0);
  const columns: ImpactedService[][] = Array.from(
    { length: depths },
    (_, index) => impacted.filter((service) => service.hops === index + 1),
  );

  const tallest = Math.max(
    1,
    ...columns.map((column) => Math.min(column.length, MAX_PER_COLUMN)),
  );
  const height = PADDING * 2 + HEADER_HEIGHT + tallest * ROW_STEP;
  const width = PADDING * 2 + NODE_WIDTH + depths * COLUMN_STEP;
  const centreY = HEADER_HEIGHT + PADDING + (tallest * ROW_STEP) / 2;

  const placed = new Map<string, Placed>();

  placed.set(origin.id, {
    id: origin.id,
    name: origin.name,
    x: PADDING,
    y: centreY - NODE_HEIGHT / 2,
    tone: "origin",
    detail: `${origin.name} — origin of the failure`,
  });

  columns.forEach((column, columnIndex) => {
    const visible = column.slice(0, MAX_PER_COLUMN);
    const top = centreY - (visible.length * ROW_STEP) / 2;

    visible.forEach((service, rowIndex) => {
      placed.set(service.id, {
        id: service.id,
        name: service.name,
        x: PADDING + (columnIndex + 1) * COLUMN_STEP,
        y: top + rowIndex * ROW_STEP + (ROW_STEP - NODE_HEIGHT) / 2,
        tone: service.certain ? "certain" : "degraded",
        detail: `${service.name} — ${service.hops} hop${
          service.hops > 1 ? "s" : ""
        } away, ${service.certain ? "certain outage" : "degraded"}`,
      });
    });
  });

  const drawable = edges.filter(
    (edge) => placed.has(edge.source) && placed.has(edge.target),
  );

  return (
    <div className="overflow-x-auto rounded-soft border border-hairline bg-surface shadow-ambient">
      <svg
        role="img"
        aria-label={`Dependency impact graph for ${origin.name}`}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--hairline)" />
          </marker>
        </defs>

        <text x={PADDING} y={PADDING} className="fill-subtle text-[12px]">
          Origin
        </text>
        {columns.map((_, index) => (
          <text
            key={index}
            x={PADDING + (index + 1) * COLUMN_STEP}
            y={PADDING}
            className="fill-subtle text-[12px]"
          >
            {index + 1} hop{index > 0 ? "s" : ""}
          </text>
        ))}

        {drawable.map((edge) => {
          const from = placed.get(edge.source)!;
          const to = placed.get(edge.target)!;

          // Hop distance is the shortest path, so a service can still depend on
          // one further from the origin than itself. Attach the line to whichever
          // sides face each other rather than assuming the source sits on the
          // right, which keeps those edges from looping around the diagram.
          const rightward = from.x <= to.x;
          const startX = rightward ? from.x + NODE_WIDTH : from.x;
          const endX = rightward ? to.x : to.x + NODE_WIDTH;
          const bend = rightward ? 50 : -50;
          const startY = from.y + NODE_HEIGHT / 2;
          const endY = to.y + NODE_HEIGHT / 2;

          return (
            <path
              key={`${edge.source}-${edge.target}`}
              d={`M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`}
              fill="none"
              stroke="var(--hairline)"
              strokeWidth={edge.criticality === "hard" ? 1.6 : 1}
              strokeDasharray={edge.criticality === "hard" ? undefined : "4 4"}
              markerEnd="url(#arrow)"
              opacity={rightward ? 0.55 : 1}
            />
          );
        })}

        {[...placed.values()].map((node) => (
          <g key={node.id}>
            <title>{node.detail}</title>
            <rect
              x={node.x}
              y={node.y}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx={4}
              className={
                node.tone === "origin"
                  ? "fill-accent stroke-accent"
                  : node.tone === "certain"
                    ? "fill-surface stroke-critical"
                    : "fill-surface stroke-hairline"
              }
            />
            <text
              x={node.x + 12}
              y={node.y + NODE_HEIGHT / 2 + 4}
              className={`text-[13px] ${
                node.tone === "origin" ? "fill-on-accent" : "fill-ink"
              }`}
            >
              {node.name.length > 22 ? `${node.name.slice(0, 21)}…` : node.name}
            </text>
          </g>
        ))}

        {columns.map((column, index) =>
          column.length > MAX_PER_COLUMN ? (
            <text
              key={`overflow-${index}`}
              x={PADDING + (index + 1) * COLUMN_STEP}
              y={centreY + (Math.min(column.length, MAX_PER_COLUMN) * ROW_STEP) / 2 + 16}
              className="fill-subtle text-[12px]"
            >
              +{column.length - MAX_PER_COLUMN} more
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}
