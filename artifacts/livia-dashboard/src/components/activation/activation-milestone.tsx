import { Sparkles } from "lucide-react";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { shouldShowActivationMilestoneOnHome } from "@workspace/policy";
import { useBusiness } from "@/lib/business-context";
import { useMembership } from "@/lib/membership-context";
import { isDemoLoginEnabled } from "@/lib/persona";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLivArrival } from "@/hooks/use-liv-arrival";

/** Setup-only banner — hides after activation (no permanent "first booking" toast). */
export function ActivationMilestone({ className }: { className?: string }) {
  const { business } = useBusiness();
  const { effectiveRole } = useMembership();
  const { suppressDuplicateSetupBanners } = useLivArrival();
  const bid = business?.id ?? "";
  const { data, isLoading } = useGetDashboardSummary(bid, {
    query: { enabled: !!bid } as never,
  });

  if (!business || !["OWNER", "ADMIN"].includes(effectiveRole ?? "")) return null;
  if (isDemoLoginEnabled) return null;
  if (suppressDuplicateSetupBanners) return null;

  if (isLoading) {
    return <Skeleton className={cn("h-12 w-full rounded-lg", className)} />;
  }

  const activation = data?.activation;
  if (!shouldShowActivationMilestoneOnHome(activation)) return null;

  const remaining =
    (activation?.activationStepsTotal ?? 0) - (activation?.activationStepsComplete ?? 0);

  return (
    <div
      className={cn(
        "mb-4 flex items-center gap-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm",
        className,
      )}
      data-testid="activation-milestone-in-progress"
    >
      <Sparkles className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <div>
        <p className="font-medium text-foreground">Finish setup</p>
        <p className="text-muted-foreground">
          {remaining} step{remaining === 1 ? "" : "s"} left — then you are ready for live bookings.
        </p>
      </div>
    </div>
  );
}
