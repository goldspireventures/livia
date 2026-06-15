import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { fetchTenantExperience } from "@/lib/tenant-experience";

export function useTenantExperience(businessId: string | undefined) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["tenant-experience", businessId],
    enabled: !!businessId,
    queryFn: () => fetchTenantExperience(businessId!, getToken),
    staleTime: 60_000,
  });
}
