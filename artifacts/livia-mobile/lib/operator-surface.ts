import { getApiBaseUrl } from "@/lib/api-base";

export type OperatorSurface = {
  platformExec: boolean;
  opsPortalUrl: string | null;
};

export async function fetchOperatorSurface(
  getToken: () => Promise<string | null>,
): Promise<OperatorSurface | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    const res = await fetch(`${getApiBaseUrl()}/api/me/operator-surface`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as OperatorSurface;
  } catch {
    return null;
  }
}
