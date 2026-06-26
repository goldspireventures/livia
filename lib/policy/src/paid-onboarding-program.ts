/**
 * Public paid onboarding — founders subscribe (or redeem a partner code) before go-live.
 */
import type { OnboardingActId } from "./onboarding-state";

export function publicPaidOnboardingEnabled(
  env: Record<string, string | undefined> = typeof process !== "undefined"
    ? (process.env as Record<string, string | undefined>)
    : {},
): boolean {
  return env.LIVIA_PUBLIC_PAID_ONBOARDING === "true";
}

/** Stripe or complimentary grant unlocks paid plan entitlements. */
export function subscriptionGrantsPaidAccess(
  stripeSubscriptionStatus: string | null | undefined,
  designPartnerEndsAt: Date | string | null | undefined,
): boolean {
  const status = stripeSubscriptionStatus?.trim().toLowerCase();
  if (status === "active" || status === "trialing" || status === "complimentary") {
    return true;
  }
  if (designPartnerEndsAt) {
    const end = designPartnerEndsAt instanceof Date ? designPartnerEndsAt : new Date(designPartnerEndsAt);
    if (!Number.isNaN(end.getTime()) && end > new Date()) return true;
  }
  return false;
}

/** Initial plan for a new shop when public paid onboarding is on. */
export function initialPlanIdForNewBusiness(
  env?: Record<string, string | undefined>,
): "trial" | null {
  return publicPaidOnboardingEnabled(env) ? "trial" : null;
}

export function appendBillingBlockingAct(
  acts: OnboardingActId[],
  env?: Record<string, string | undefined>,
): OnboardingActId[] {
  if (!publicPaidOnboardingEnabled(env)) return acts;
  if (acts.includes("a9_billing")) return acts;
  return [...acts, "a9_billing"];
}
