import { getApiBaseUrl } from "@/lib/api-base";
import type { TenantExperience } from "@workspace/policy";

export async function fetchTenantExperience(
  businessId: string,
  getToken: () => Promise<string | null>,
): Promise<TenantExperience | null> {
  const token = await getToken();
  if (!token) return null;
  const res = await fetch(
    `${getApiBaseUrl()}/api/me/tenant-experience?businessId=${encodeURIComponent(businessId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  return (await res.json()) as TenantExperience;
}
