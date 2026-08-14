export function DatabaseError({ detail }: { detail: string }) {
  return (
    <div className="rounded-soft border border-hairline border-l-2 border-l-critical bg-surface p-8">
      <h2 className="text-heading-md font-bold text-critical">
        Cannot reach the graph database
      </h2>
      <p className="mt-3 max-w-2xl text-body-md text-subtle">
        Faultline could not open a session against the configured CognoDB
        instance, so no dependency data can be shown. Check that the instance is
        running and that COGNODB_URI, COGNODB_USER and COGNODB_PASSWORD are set.
      </p>
      <p className="mt-6 font-mono text-caption-sm text-subtle">{detail}</p>
    </div>
  );
}
