import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { useBusiness } from "@/contexts/BusinessContext";

export type Role = "OWNER" | "ADMIN" | "STAFF";

interface MembershipResponse {
  businessId: string;
  role: Role;
  staffId: string | null;
  isReception?: boolean;
  tenureDays?: number;
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
        throw new Error(`membership ${res.status}`);
      }
      return res.json();
    },
  });

  return {
    role: data?.role ?? null,
    staffId: data?.staffId ?? null,
    isReception: data?.isReception ?? false,
    tenureDays: data?.tenureDays ?? 0,
    isLoading: isLoading && !!bid,
  };
}
