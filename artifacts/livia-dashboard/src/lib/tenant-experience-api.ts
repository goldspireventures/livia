import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import type { TenantExperience } from "@workspace/policy";

export function fetchTenantExperience(businessId: string) {
  return apiFetch<TenantExperience>(
    `/me/tenant-experience?businessId=${encodeURIComponent(businessId)}`,
  );
}

export function useTenantExperience(businessId: string | undefined) {
  return useQuery({
    queryKey: ["tenant-experience", businessId],
    queryFn: () => fetchTenantExperience(businessId!),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}
