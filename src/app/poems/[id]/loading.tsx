import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20" role="status" aria-label="Loading">
      <Skeleton className="mx-auto mb-4 h-10 w-2/3" />
      <Skeleton className="mx-auto mb-14 h-3 w-40" />
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="mb-4 h-5 w-full max-w-[34rem]" />
      ))}
    </div>
  );
}
