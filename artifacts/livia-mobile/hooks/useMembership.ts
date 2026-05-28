import { useGetMyMembership } from "@workspace/api-client-react";
import { useBusiness } from "@/contexts/BusinessContext";

export type Role = "OWNER" | "ADMIN" | "STAFF";

export function useMembership() {
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";

  const { data, isLoading } = useGetMyMembership(bid, {
    query: { enabled: !!bid, staleTime: 60_000 } as never,
  });

  return {
    role: (data?.role as Role | undefined) ?? null,
    staffId: data?.staffId ?? null,
    isReception: data?.isReception ?? false,
    tenureDays: data?.tenureDays ?? 0,
    isLoading: isLoading && !!bid,
  };
}
