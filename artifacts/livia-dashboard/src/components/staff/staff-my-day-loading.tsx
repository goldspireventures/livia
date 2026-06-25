import { Skeleton } from "@/components/ui/skeleton";

/** w4.staff.my-day — hero 200px + 4 timeline row skeletons. */
export function StaffMyDayLoading() {
  return (
    <div className="space-y-6 pb-28" data-testid="staff-my-day-loading" role="status" aria-live="polite">
      <span className="sr-only">Loading your day</span>
      <Skeleton className="h-4 w-40 mx-auto" />
      <Skeleton className="h-[200px] w-full rounded-[20px]" />
      <Skeleton className="h-3 w-28" />
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}
