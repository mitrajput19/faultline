import { Suspense } from "react";
import { ServiceFilters } from "@/components/ServiceFilters";
import { ServiceTable } from "@/components/ServiceTable";
import { Skeleton } from "@/components/Skeleton";

type SearchParams = Promise<{ q?: string; tier?: string }>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, tier } = await searchParams;
  const search = q?.trim() ?? "";
  const parsedTier = tier ? Number(tier) : NaN;
  const activeTier = [1, 2, 3].includes(parsedTier) ? parsedTier : null;

  return (
    <div className="space-y-12">
      <div className="max-w-2xl">
        <h1 className="text-display-sm font-bold">Service estate</h1>
        <p className="mt-3 text-body-md text-subtle">
          Every service Faultline knows about, with its owning team. Open a
          service to see what fails with it and who needs to be paged.
        </p>
      </div>

      <ServiceFilters search={search} tier={activeTier} />

      <Suspense key={`${search}-${activeTier}`} fallback={<Skeleton />}>
        <ServiceTable search={search} tier={activeTier} />
      </Suspense>
    </div>
  );
}
