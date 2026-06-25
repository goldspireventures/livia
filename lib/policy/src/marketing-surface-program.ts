/** Marketing ↔ app handoff hosts — classify visitor marketing hostname. */

export type MarketingSurfaceTier = "production" | "staging" | "local";

export const LIVIA_MARKETING_SURFACE_URLS = {
  production: {
    marketing: "https://livia-hq.com",
    dashboard: "https://app.livia-hq.com",
    api: "https://api.livia-hq.com",
  },
  staging: {
    marketing: "https://staging.livia-hq.com",
    dashboard: "https://app.staging.livia-hq.com",
    api: "https://api.staging.livia-hq.com",
  },
} as const;

/** Classify marketing hostname — pure for tests and runtime. */
export function classifyMarketingHost(hostname: string): MarketingSurfaceTier {
  const host = hostname.trim().toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) {
    return "local";
  }
  if (host === "livia-hq.com" || host === "www.livia-hq.com") {
    return "production";
  }
  if (host.includes("staging") || host === "livia-stg.livia-hq.com") {
    return "staging";
  }
  return "production";
}
