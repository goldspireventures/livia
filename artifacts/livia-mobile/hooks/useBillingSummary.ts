import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

export type BillingSummary = {
  planId: string;
  planName: string;
  entitlements: string[];
  usage: Record<string, number>;
  stripeSubscriptionStatus: string | null;
  designPartnerActive: boolean;
};

export function useBillingSummary(businessId: string | undefined) {
  return useQuery({
    queryKey: ["billing-summary", businessId],
    queryFn: () =>
      customFetch<BillingSummary>(`/api/businesses/${businessId}/billing`),
    enabled: !!businessId,
    staleTime: 90_000,
  });
}
