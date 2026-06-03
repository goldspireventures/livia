import {
  MARKETING_DEMO_GATE_QUERY_PARAM,
  MARKETING_DEMO_GATE_STORAGE_KEY,
} from "@workspace/policy";
import { getMarketingOrigin } from "@/lib/surface-urls";

/** Persist invite key on the app origin (marketing uses sessionStorage on W1). */
export function readStoredMarketingDemoGateKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(MARKETING_DEMO_GATE_STORAGE_KEY);
    return stored?.trim() || null;
  } catch {
    return null;
  }
}

export function persistMarketingDemoGateKey(key: string): void {
  try {
    localStorage.setItem(MARKETING_DEMO_GATE_STORAGE_KEY, key.trim());
  } catch {
    /* private mode */
  }
}

export function captureMarketingDemoGateKeyFromLocation(): void {
  if (typeof window === "undefined") return;
  const fromQuery = new URLSearchParams(window.location.search).get(
    MARKETING_DEMO_GATE_QUERY_PARAM,
  );
  if (fromQuery?.trim()) persistMarketingDemoGateKey(fromQuery);
}

export function hasMarketingDemoGateKey(): boolean {
  return readStoredMarketingDemoGateKey() != null;
}

/** W1 invited-guest concierge on marketing (not app G1). */
export function getMarketingDemoConciergeUrl(): string {
  const origin = getMarketingOrigin();
  const key = readStoredMarketingDemoGateKey();
  if (key) {
    return `${origin}/demo?${MARKETING_DEMO_GATE_QUERY_PARAM}=${encodeURIComponent(key)}`;
  }
  return `${origin}/demo`;
}

export function appendMarketingDemoGateKeyToUrl(url: string, key?: string | null): string {
  const gateKey = key?.trim() || readStoredMarketingDemoGateKey();
  if (!gateKey) return url;
  const parsed = new URL(url, window.location.origin);
  parsed.searchParams.set(MARKETING_DEMO_GATE_QUERY_PARAM, gateKey);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
