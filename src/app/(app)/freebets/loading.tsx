export default function Loading() {
  return (
    <div className="space-y-6 pb-24">
      <div>
        <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        <div className="h-4 w-48 rounded bg-muted/50 animate-pulse mt-1" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-xl bg-card animate-pulse" />
      ))}
    </div>
  );
}
