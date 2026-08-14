import { Suspense } from "react";
import Link from "next/link";
import { BlastRadius } from "@/components/BlastRadius";
import { Skeleton } from "@/components/Skeleton";
import { DEPTH_OPTIONS, MAX_DEPTH } from "@/lib/queries/blastRadius";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ depth?: string }>;

export default async function ServicePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { depth } = await searchParams;

  const requested = depth ? Number(depth) : NaN;
  const activeDepth =
    requested >= 1 && requested <= MAX_DEPTH ? Math.floor(requested) : 2;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-sm text-muted hover:text-ink">
          ← All services
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted">
            Depth
          </span>
          {DEPTH_OPTIONS.map((option) => (
            <Link
              key={option}
              href={`/services/${id}?depth=${option}`}
              className={`rounded-lg border px-2.5 py-1 text-sm transition-colors ${
                option === activeDepth
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              {option}
            </Link>
          ))}
        </div>
      </div>

      <Suspense key={`${id}-${activeDepth}`} fallback={<Skeleton rows={6} />}>
        <BlastRadius id={id} depth={activeDepth} />
      </Suspense>
    </div>
  );
}
