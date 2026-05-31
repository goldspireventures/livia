import { useGetDashboardSummary } from "@workspace/api-client-react";
import { useBusiness } from "@/lib/business-context";
import { useInAppNotifications } from "@/hooks/use-in-app-notifications";

/** Pending bookings + inbox handoffs + unread feed — for nav badges and bell. */
export function useNavActionCounts() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const { data: summary } = useGetDashboardSummary(bid, {
    query: { enabled: !!bid, refetchInterval: 60_000 } as never,
  });
  const { unreadCount } = useInAppNotifications();

  const pendingCount = summary?.pendingCount ?? 0;
  const handedOffCount =
    (summary as { handedOffCount?: number } | undefined)?.handedOffCount ?? 0;

  return { pendingCount, handedOffCount, unreadCount };
}
