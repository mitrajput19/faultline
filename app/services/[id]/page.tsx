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
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <Link
          href="/"
          className="rounded-sharp text-caption-sm text-subtle underline decoration-hairline underline-offset-4 hover:text-ink hover:decoration-accent"
        >
          All services
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-caption-sm text-subtle">Depth</span>
          <div className="flex gap-2">
            {DEPTH_OPTIONS.map((option) => (
              <Link
                key={option}
                href={`/services/${id}?depth=${option}`}
                aria-current={option === activeDepth ? "true" : undefined}
                className={`flex h-11 w-11 items-center justify-center rounded-soft border text-caption-sm font-medium transition-colors ${
                  option === activeDepth
                    ? "border-accent bg-accent text-on-accent"
                    : "border-hairline bg-surface text-subtle hover:border-accent hover:text-ink"
                }`}
              >
                {option}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Suspense key={`${id}-${activeDepth}`} fallback={<Skeleton rows={6} />}>
        <BlastRadius id={id} depth={activeDepth} />
      </Suspense>
    </div>
  );
}
