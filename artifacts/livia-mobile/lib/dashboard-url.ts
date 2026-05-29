import { getApiBaseUrl } from "@/lib/api-base";

/** Web dashboard base for deep links (settings tabs, lifecycle, policy editor). */
export function getDashboardBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_DASHBOARD_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;
  const api = getApiBaseUrl().replace(/\/+$/, "");
  if (api.includes(":3000")) return api.replace(":3000", ":5173");
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
