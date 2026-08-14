export function DatabaseError({ detail }: { detail: string }) {
  return (
    <div className="rounded-xl border border-critical/30 bg-critical/5 p-8">
      <h2 className="text-base font-semibold text-critical">
        Cannot reach the graph database
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
        Faultline could not open a session against the configured CognoDB
        instance, so no dependency data can be shown. Check that the instance is
        running and that COGNODB_URI, COGNODB_USER and COGNODB_PASSWORD are set.
      </p>
      <p className="mt-4 font-mono text-xs text-muted/70">{detail}</p>
    </div>
  );
}
