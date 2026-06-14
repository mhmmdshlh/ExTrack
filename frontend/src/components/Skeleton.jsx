export default function Skeleton({ count = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border bg-card p-3"
        >
          <div className="mb-2 h-4 w-3/5 rounded bg-muted-foreground/20" />
          <div className="h-3 w-2/5 rounded bg-muted-foreground/15" />
        </div>
      ))}
    </div>
  );
}
