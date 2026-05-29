import { isStagingDeploy } from "@/lib/deploy-environment";

/**
 * No-sign-in onboarding UI lab.
 * - Local: `/dev/onboarding-preview`
 * - Staging: `/onboarding-preview` (and `/dev/onboarding-preview` alias)
 * - Production app: off unless `VITE_ONBOARDING_PREVIEW_ROUTE=true` (avoid on prod)
 */
export function isOnboardingPreviewRouteEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (isStagingDeploy()) return true;
  return import.meta.env.VITE_ONBOARDING_PREVIEW_ROUTE === "true";
}
