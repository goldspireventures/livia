import {
  MARKETING_DEMO_GATE_QUERY_PARAM,
  MARKETING_DEMO_GATE_STORAGE_KEY,
} from "@workspace/policy";
import { marketingApiUrl } from "@/lib/marketing-api-client";

export function readDemoGateKeyFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const fromQuery = new URLSearchParams(window.location.search).get(MARKETING_DEMO_GATE_QUERY_PARAM);
  if (fromQuery?.trim()) return fromQuery.trim();
  try {
    const stored = sessionStorage.getItem(MARKETING_DEMO_GATE_STORAGE_KEY);
    return stored?.trim() || null;
  } catch {
    return null;
  }
}

export function persistDemoGateKey(key: string): void {
  try {
    sessionStorage.setItem(MARKETING_DEMO_GATE_STORAGE_KEY, key.trim());
  } catch {
    /* private mode */
  }
}

export function clearDemoGateKey(): void {
  try {
    sessionStorage.removeItem(MARKETING_DEMO_GATE_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

export async function verifyDemoGateKey(key: string): Promise<boolean> {
  const url = marketingApiUrl(
    `/api/public/marketing/demo-gate/verify?${MARKETING_DEMO_GATE_QUERY_PARAM}=${encodeURIComponent(key)}`,
  );
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return false;
    const body = (await res.json()) as { valid?: boolean };
    return body.valid === true;
  } catch {
    return false;
  }
}

export function demoConciergeUrlWithKey(key: string): string {
  return `/demo?${MARKETING_DEMO_GATE_QUERY_PARAM}=${encodeURIComponent(key)}`;
}
