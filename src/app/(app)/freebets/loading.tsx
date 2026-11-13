export default function Loading() {
  return (
    <div className="space-y-6 pb-24">
      <div>
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-4 w-48 animate-pulse rounded bg-muted/50" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-card" />
      ))}
    </div>
  );
}
