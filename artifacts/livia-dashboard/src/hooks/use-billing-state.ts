import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useBusiness } from "@/lib/business-context";
export type BillingStateSnapshot = {
  planId: string;
  planName: string;
  baseEurCentsPerMonth: number;
  seatEurCentsPerMonth: number | null;
  activeStaffSeats: number;
  entitlements: string[];
  usage: Record<string, number>;
  voiceOutcomeShareEurCents: number;
  voiceOutcomeCapEurCents: number | null;
  voiceOutcomeShareRate: number;
  stripeSubscriptionStatus: string | null;
  designPartnerActive: boolean;
};

export function useBillingState() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";

  return useQuery({
    queryKey: ["billing-state", bid],
    queryFn: () => customFetch<BillingStateSnapshot>(`/api/businesses/${bid}/billing`),
    enabled: !!bid,
    staleTime: 60_000,
  });
}

export function hasEntitlement(
  state: BillingStateSnapshot | undefined,
  key: string,
): boolean {
  return !!state?.entitlements.includes(key);
}
