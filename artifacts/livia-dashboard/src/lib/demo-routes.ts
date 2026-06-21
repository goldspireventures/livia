import { getMarketingDemoConciergeUrl, readStoredMarketingDemoGateKey } from "@/lib/marketing-demo-gate";
import { getMarketingOrigin } from "@/lib/surface-urls";

/** W1 prospect gate — same host as staging marketing (`staging.livia-hq.com/demo`). */
export function marketingDemoGateUrl(): string {
  return `${getMarketingOrigin()}/demo`;
}

export function marketingBookDemoUrl(): string {
  return `${getMarketingOrigin()}/book-demo`;
}

/** @deprecated Founder G1 launcher retired — prospects use marketing concierge. Kept for path checks only. */
export const FOUNDER_DEMO_LAUNCHER_PATH = "/demo/founder";

export function isFounderDemoLauncherPath(path: string): boolean {
  const p = path.split("?")[0]?.replace(/\/+$/, "") || "/";
  return p === FOUNDER_DEMO_LAUNCHER_PATH || p.startsWith(`${FOUNDER_DEMO_LAUNCHER_PATH}/`);
}

/** Bare `/demo` on app → marketing W1 gate in prod/staging. Local dev serves G1 launcher on :5173. */
export function shouldRedirectAppDemoToMarketing(path: string): boolean {
  if (import.meta.env.DEV) return false;
  const p = path.split("?")[0]?.replace(/\/+$/, "") || "/";
  if (p !== "/demo") return false;
  const params = new URLSearchParams(path.includes("?") ? path.split("?")[1] : "");
  return !params.has("founder");
}

/** Retired founder launcher — always send to marketing concierge (or book-demo if no invite key). */
export function shouldRedirectFounderLauncherToMarketing(path: string): boolean {
  return isFounderDemoLauncherPath(path);
}

export function prospectDemoEntryUrl(): string {
  return readStoredMarketingDemoGateKey() ? getMarketingDemoConciergeUrl() : marketingBookDemoUrl();
}

/** Wedge G2 back — marketing concierge when invited, else book-demo. */
export function demoWorldsBackUrl(): string {
  return prospectDemoEntryUrl();
}
