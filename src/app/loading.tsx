import { CardSkeleton, Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8" role="status" aria-label="Loading">
      <Skeleton className="mb-10 h-10 w-64" />
      <div className="grid gap-6 sm:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
