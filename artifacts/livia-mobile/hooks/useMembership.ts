// Mobile counterpart to the web membership context.
//
// Mobile defers persona-switching to v2 (rare on phones; the staff
// device IS the staff persona). For now this hook just surfaces the
// real role so the tab bar can adapt.

import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { useBusiness } from "@/contexts/BusinessContext";

export type Role = "OWNER" | "ADMIN" | "STAFF";

interface MembershipResponse {
  businessId: string;
  role: Role;
  staffId: string | null;
}

const BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export function useMembership() {
  const { getToken } = useAuth();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["membership", bid],
    enabled: !!bid,
    staleTime: 60_000,
    queryFn: async (): Promise<MembershipResponse> => {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/me/businesses/${bid}/membership`, {
        headers: token
          ? { Accept: "application/json", Authorization: `Bearer ${token}` }
          : { Accept: "application/json" },
      });
      if (!res.ok) {
        // Soft-fail to OWNER so existing single-user accounts keep
        // working if the endpoint somehow isn't deployed yet.
        throw new Error(`membership ${res.status}`);
      }
      return res.json();
    },
  });

  return {
    role: data?.role ?? null,
    staffId: data?.staffId ?? null,
    isLoading: isLoading && !!bid,
  };
}
