import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { OPERATIONAL_REFETCH_MS } from "@/lib/operational-cache";

export type LivMandatePayload = {
  mandate: {
    rung: string;
    trustScore: number;
    maxAutoValueMinor: number;
    allowedActions?: string[];
    deniedActions?: string[];
    ownerNote?: string;
  };
  defaults: { rung: string };
  vertical: string;
  simulation: Array<{ label: string; outcome: string; reason: string }>;
};

export function useLivMandate(businessId: string | undefined) {
  return useQuery({
    queryKey: ["liv-mandate", businessId],
    queryFn: () => customFetch<LivMandatePayload>(`/api/businesses/${businessId}/liv-mandate`),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

export type LivProposalRow = {
  id: string;
  action: string;
  status: string;
  outcomePreview: string | null;
  reason: string | null;
  valueMinor?: number;
  createdAt: string;
};

export function useLivProposals(businessId: string | undefined) {
  return useQuery({
    queryKey: ["liv-proposals", businessId],
    queryFn: () =>
      customFetch<{ data: LivProposalRow[] }>(`/api/businesses/${businessId}/liv-proposals`),
    enabled: !!businessId,
    staleTime: 30_000,
    refetchInterval: OPERATIONAL_REFETCH_MS,
  });
}

export async function resolveLivProposal(
  businessId: string,
  proposalId: string,
  status: "approved" | "dismissed",
) {
  return customFetch(`/api/businesses/${businessId}/liv-proposals/${proposalId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
