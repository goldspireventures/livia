import { useGetBusinessBilling } from "@workspace/api-client-react";
import { useMemo } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useMembership } from "@/hooks/useMembership";

export function useEntitlements() {
  const { currentBusiness } = useBusiness();
  const { role } = useMembership();
  const bid = currentBusiness?.id ?? "";
  const canReadBilling = role === "OWNER" || role === "ADMIN";

  const { data, isLoading } = useGetBusinessBilling(bid, {
    query: { enabled: !!bid && canReadBilling, staleTime: 60_000 } as never,
  });

  const entitlements = useMemo(() => new Set(data?.entitlements ?? []), [data?.entitlements]);

  return {
    isLoading: canReadBilling && isLoading,
    planId: data?.planId ?? "trial",
    entitlements,
    has: (key: string) => entitlements.has(key),
    voiceEnabled: entitlements.has("voice_receptionist"),
  };
}
