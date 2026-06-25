import { Skeleton } from "@/components/ui/skeleton";

/** w4.owner.chain.web — 3 shop card skeletons + header. */
export function FounderChainLoading() {
  return (
    <div className="space-y-6" data-testid="founder-chain-loading" role="status" aria-live="polite">
      <span className="sr-only">Loading portfolio overview</span>
      <div className="space-y-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
