import { Skeleton } from "@/components/ui/skeleton";

/** Screen card loading — hero 220px + 4 service row skeletons. */
export function PublicBookLoading() {
  return (
    <div
      className="min-h-screen bg-background max-w-xl mx-auto px-4 py-0"
      data-testid="public-book-loading"
      aria-busy
      aria-label="Loading booking page"
    >
      <Skeleton className="h-16 w-full rounded-none" />
      <Skeleton className="h-[220px] w-full rounded-b-3xl -mx-4 sm:mx-0 max-w-none" />
      <div className="space-y-3 mt-8 px-0">
        <Skeleton className="h-3 w-24" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
