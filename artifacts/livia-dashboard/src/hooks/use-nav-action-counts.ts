import { useGetOwnerIntelligence } from "@workspace/api-client-react";
import { ownerIntelBadgesForNav, resolveConsultInboxNavAttention, isConsultFirstVertical, buildSettingsAttentionRows } from "@workspace/policy";
import { useBusiness } from "@/lib/business-context";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { useInAppNotifications } from "@/hooks/use-in-app-notifications";
import { useMemo } from "react";

/** Pending bookings + inbox + commerce/capability act — nav badges and bell. */
export function useNavActionCounts() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const vertical = (business as { vertical?: string } | null)?.vertical;
  const consultFirst = isConsultFirstVertical(vertical);
  const { data: summary } = useGetDashboardSummary(bid, {
    query: { enabled: !!bid, refetchInterval: 60_000 } as never,
  });
  const { data: ownerIntel } = useGetOwnerIntelligence(bid, {
    query: { enabled: !!bid, staleTime: 90_000 } as never,
  });
  const { unreadCount } = useInAppNotifications();

  const pendingCount = summary?.pendingCount ?? 0;
  const studioPendingCount =
    (summary as { studioPendingCount?: number } | undefined)?.studioPendingCount ?? pendingCount;
  const handedOffCount =
    (summary as { handedOffCount?: number } | undefined)?.handedOffCount ?? 0;
  const needsYouCount =
    (summary as { needsYouCount?: number } | undefined)?.needsYouCount ?? 0;
  const newEnquiriesCount =
    (summary as { newEnquiriesCount?: number } | undefined)?.newEnquiriesCount ?? 0;
  const inboxAttentionCount =
    (summary as { inboxAttentionCount?: number } | undefined)?.inboxAttentionCount ??
    needsYouCount + handedOffCount;

  const consultInboxAttention = useMemo(
    () =>
      resolveConsultInboxNavAttention({
        newEnquiries: newEnquiriesCount,
        unviewedHandoffs: handedOffCount,
      }),
    [newEnquiriesCount, handedOffCount],
  );

  const intelBadges = useMemo(() => ownerIntelBadgesForNav(ownerIntel ?? null), [ownerIntel]);
  const settingsAttentionLabel = useMemo(() => {
    const rows = buildSettingsAttentionRows(ownerIntel ?? null).filter((r) =>
      r.href.includes("/settings"),
    );
    if (rows.length === 0) return "";
    if (rows.length === 1) return rows[0]!.title;
    return `${rows.length} settings items need attention`;
  }, [ownerIntel]);

  return {
    pendingCount: studioPendingCount,
    totalPendingCount: pendingCount,
    handedOffCount,
    newEnquiriesCount,
    inboxAttentionCount: consultFirst ? consultInboxAttention.count : inboxAttentionCount,
    inboxAttentionLabel: consultFirst ? consultInboxAttention.label : "",
    settingsAttentionLabel,
    consultFirst,
    unreadCount,
    intelBadges,
  };
}
