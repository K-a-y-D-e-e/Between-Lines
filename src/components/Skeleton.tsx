import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-sm bg-line/60", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="border border-line p-6" role="status" aria-label="Loading">
      <Skeleton className="mb-4 h-6 w-2/3" />
      <Skeleton className="mb-6 h-3 w-1/3" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
