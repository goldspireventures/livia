import { getApiBaseUrl } from "@/lib/api-base";

function isLocalDevApi(api: string): boolean {
  return (
    api.includes("localhost") ||
    api.includes("127.0.0.1") ||
    /https?:\/\/192\.168\.\d+\.\d+/.test(api) ||
    /https?:\/\/10\.\d+\.\d+\.\d+/.test(api)
  );
}

/** Web dashboard base for deep links (settings tabs, lifecycle, policy editor). */
export function getDashboardBaseUrl(): string {
  const api = getApiBaseUrl().replace(/\/+$/, "");
  const localDash = api.includes(":3000") ? api.replace(":3000", ":5173") : null;
  const explicit = process.env.EXPO_PUBLIC_DASHBOARD_URL?.replace(/\/+$/, "");
  if (explicit) {
    // dev:device sets LAN API; .env may still point at staging — prefer local dashboard.
    if (localDash && isLocalDevApi(api) && !isLocalDevApi(explicit)) {
      return localDash;
    }
    return explicit;
  }
  if (localDash) return localDash;
  return "https://app.livia-hq.com";
}

/**
 * Static W2 gateway assets (`/w2-gateway/cards/*`) — served by the dashboard app.
 * On a physical device, local :5173 is often offline; use staging/prod for card photos.
 */
export function getGatewayAssetsBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_GATEWAY_ASSETS_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;
  const dash = process.env.EXPO_PUBLIC_DASHBOARD_URL?.replace(/\/+$/, "");
  if (dash) return dash;
  const api = getApiBaseUrl().replace(/\/+$/, "");
  if (isLocalDevApi(api)) {
    return "https://app.staging.livia-hq.com";
  }
  if (api.includes("api.staging.")) {
    return "https://app.staging.livia-hq.com";
  }
  return "https://app.livia-hq.com";
}

export function dashboardSettingsUrl(tab: string, businessId?: string): string {
  const base = getDashboardBaseUrl();
  const q = new URLSearchParams({ tab });
  if (businessId) q.set("businessId", businessId);
  return `${base}/settings?${q.toString()}`;
}

export function dashboardLifecycleUrl(): string {
  return `${getDashboardBaseUrl()}/lifecycle`;
}

export function dashboardPremisesUrl(): string {
  return `${getDashboardBaseUrl()}/premises`;
}

export function dashboardDayPackagesUrl(): string {
  return `${getDashboardBaseUrl()}/day-packages`;
}
