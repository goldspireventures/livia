import { Skeleton } from "@/components/ui/skeleton";

/** Screen card w5.public.visit — hero card skeleton. */
export function PublicVisitLoading() {
  return (
    <div
      className="min-h-screen bg-background max-w-xl mx-auto px-4 py-6"
      data-testid="guest-visit-loading"
      aria-busy
      aria-label="Loading visit"
    >
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-5 flex-1 max-w-[160px]" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-[220px] w-full rounded-2xl" />
      <div className="space-y-2 mt-8">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
