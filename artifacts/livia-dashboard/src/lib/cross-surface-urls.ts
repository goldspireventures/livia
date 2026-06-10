/** Operator app ↔ native mobile — same tenant session, shared API state. */

const MOBILE_SCHEME = "livia://";

export function mobileOnboardingSetupUrl(): string {
  return `${MOBILE_SCHEME}onboarding-setup`;
}

export function mobileMyLiviaUrl(): string {
  return `${MOBILE_SCHEME}my-livia`;
}

export function mobileSettingsUrl(tab = "shop"): string {
  return `${MOBILE_SCHEME}settings${tab ? `?tab=${encodeURIComponent(tab)}` : ""}`;
}

export const CROSS_SURFACE_WEB_COPY = {
  continueOnMobileTitle: "Continue on mobile",
  continueOnMobileBody:
    "Same shop and onboarding progress. Open the Livia app to finish essentials with push alerts, haptics, and floor-friendly flows.",
  maryGuestTitle: "Demo guest Mary (My Livia)",
  maryGuestBody:
    "Use +353 87 100 0001 on /my — same vault on phone and browser after OTP. Staging code 000000.",
} as const;
