export function Skeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="overflow-hidden rounded-soft border border-hairline bg-surface shadow-ambient"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-12 animate-pulse border-b border-hairline last:border-0 bg-canvas"
          style={{ animationDelay: `${index * 60}ms` }}
        />
      ))}
    </div>
  );
}
