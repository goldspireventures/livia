import { getMarketingDemoConciergeUrl, readStoredMarketingDemoGateKey } from "@/lib/marketing-demo-gate";
import { getMarketingOrigin } from "@/lib/surface-urls";

/** W1 prospect gate — same host as staging marketing (`staging.livia-hq.com/demo`). */
export function marketingDemoGateUrl(): string {
  return `${getMarketingOrigin()}/demo`;
}

/** Founder / QA G1 launcher on app host only — never on marketing. */
export const FOUNDER_DEMO_LAUNCHER_PATH = "/demo/founder";

export function isFounderDemoLauncherPath(path: string): boolean {
  const p = path.split("?")[0]?.replace(/\/+$/, "") || "/";
  return p === FOUNDER_DEMO_LAUNCHER_PATH || p.startsWith(`${FOUNDER_DEMO_LAUNCHER_PATH}/`);
}

/** Bare `/demo` on app → marketing gate (prod/staging/local parity). Wedge routes stay on app. */
export function shouldRedirectAppDemoToMarketing(path: string): boolean {
  const p = path.split("?")[0]?.replace(/\/+$/, "") || "/";
  if (p !== "/demo") return false;
  const params = new URLSearchParams(path.includes("?") ? path.split("?")[1] : "");
  // Deep links from marketing concierge use /demo/wedge/* — not bare /demo
  return !params.has("founder");
}

/** Wedge G2 back — marketing concierge when invited, else founder G1. */
export function demoWorldsBackUrl(): string {
  if (readStoredMarketingDemoGateKey()) return getMarketingDemoConciergeUrl();
  return FOUNDER_DEMO_LAUNCHER_PATH;
}
