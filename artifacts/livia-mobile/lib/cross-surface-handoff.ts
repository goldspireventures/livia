import { getDashboardBaseUrl } from "@/lib/dashboard-url";

/** Founder sign-in on web — bypasses demo launcher when demo mode is on. */
export function webFounderHandoffUrl(path: string): string {
  const base = getDashboardBaseUrl();
  const params = new URLSearchParams({ beta: "1", redirect_url: path });
  return `${base}/sign-in?${params.toString()}`;
}

/** Same business row + onboardingState — continue on web dashboard. */
export function webOnboardingUrl(businessId?: string): string {
  const q = businessId ? `?businessId=${encodeURIComponent(businessId)}` : "";
  return webFounderHandoffUrl(`/onboarding${q}`);
}

export function webOnboardingSettingsUrl(tab = "shop", businessId?: string): string {
  const q = new URLSearchParams({ tab });
  if (businessId) q.set("businessId", businessId);
  return webFounderHandoffUrl(`/settings?${q.toString()}`);
}

export function webMyLiviaUrl(): string {
  return `${getDashboardBaseUrl()}/my`;
}

/** Expo dev / staging — open native app setup (universal link when configured). */
export function mobileOnboardingDeepLink(): string {
  return "livia://onboarding-setup";
}

export const CROSS_SURFACE_COPY = {
  mobileToWebTitle: "Continue on web",
  mobileToWebBody:
    "Same shop, same progress — open the dashboard to use the full wizard, logo upload, and live booking preview.",
  webToMobileTitle: "Continue on mobile",
  webToMobileBody:
    "Same shop, same progress — finish essentials on your phone with haptics, push alerts, and floor-friendly flows.",
  maryGuestTitle: "Demo guest Mary",
  maryGuestBody:
    "Sign in to My Livia with +353 87 100 0001 (staging code 000000). Works on mobile app and web — one vault.",
} as const;
