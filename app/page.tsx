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
    <div>
      <section className="bg-surface-dark px-5 py-20 text-white sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-caption-sm font-semibold tracking-[0.12em] text-accent-dark uppercase">Incident response</p>
          <h1 className="mt-4 text-display-lg font-semibold">Know the faultline.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-body-md text-white/75">
            See every service your platform depends on before a local failure becomes a customer event.
          </p>
        </div>
      </section>

      <section className="bg-parchment px-5 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <h2 className="text-display-sm font-semibold">Service estate</h2>
            <p className="mt-3 text-body-md text-subtle">
          Every service Faultline knows about, with its owning team. Open a
          service to see what fails with it and who needs to be paged.
            </p>
          </div>

          <div className="mt-10"><ServiceFilters search={search} tier={activeTier} /></div>

          <div className="mt-8"><Suspense key={`${search}-${activeTier}`} fallback={<Skeleton />}>
            <ServiceTable search={search} tier={activeTier} />
          </Suspense></div>
        </div>
      </section>
    </div>
  );
}
