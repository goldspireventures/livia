import { Skeleton } from "@/components/ui/skeleton";

/** w4.owner.dashboard.web — briefing + KPI + module skeletons. */
export function OwnerDashboardLoading() {
  return (
    <div className="space-y-6" data-testid="owner-dashboard-loading" role="status" aria-live="polite">
      <span className="sr-only">Loading dashboard</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
    </div>
  );
}
