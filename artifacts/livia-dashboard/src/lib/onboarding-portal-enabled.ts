import { isStagingDeploy } from "@/lib/deploy-environment";

/**
 * Portal onboarding (immersive shell) rollout.
 *
 * - Preview routes — always on in local dev + staging deploy.
 * - `/onboarding` — local + staging: on by default; prod: opt-in via env.
 *
 * See `docs/operations/STAGING-SETUP.md`.
 */
export function isOnboardingPortalExperienceEnabled(options?: { previewMode?: boolean }): boolean {
  if (options?.previewMode) return true;
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_ONBOARDING_PORTAL_EXPERIENCE !== "false";
  }
  if (isStagingDeploy()) {
    return import.meta.env.VITE_ONBOARDING_PORTAL_EXPERIENCE !== "false";
  }
  return import.meta.env.VITE_ONBOARDING_PORTAL_EXPERIENCE !== "false";
}
