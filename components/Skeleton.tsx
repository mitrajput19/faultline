export function Skeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-px overflow-hidden rounded-xl border border-line">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-14 animate-pulse bg-surface"
          style={{ animationDelay: `${index * 60}ms` }}
        />
      ))}
    </div>
  );
}
