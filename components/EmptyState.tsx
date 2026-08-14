export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-soft border border-dashed border-hairline bg-surface px-8 py-16">
      <p className="text-body-md font-medium text-ink">{title}</p>
      <p className="mt-2 max-w-md text-body-md text-subtle">{description}</p>
    </div>
  );
}
