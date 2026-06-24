/**
 * Registration + session routing — which business a signed-in user sees,
 * and where legal acceptance sends them. Prevents demo tenants and stale
 * cache from hijacking real founder sign-ups.
 */
import { listDemoWorldSlugs } from "./demo-subvertical-roster";
import { isOnboardingAppUnlocked } from "./onboarding-program";
import type { OnboardingState } from "./onboarding-state";

const DEMO_SESSION_EMAIL_DOMAINS = new Set(["livia.io", "demo.livia-hq.com"]);

export type SessionBusinessLike = {
  id: string;
  slug: string;
  ownerId?: string;
  vertical?: string | null;
  onboardingState?: OnboardingState | null;
};

export function isDemoSessionEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  const at = lower.lastIndexOf("@");
  if (at <= 0) return false;
  return DEMO_SESSION_EMAIL_DOMAINS.has(lower.slice(at + 1));
}

export function isDemoWorldSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return listDemoWorldSlugs().includes(slug);
}

/** Real founders never see demo-world tenants unless they use a demo roster email. */
export function filterSessionBusinesses<T extends { slug: string }>(
  businesses: T[],
  email: string | null | undefined,
): T[] {
  if (isDemoSessionEmail(email)) return businesses;
  return businesses.filter((b) => !isDemoWorldSlug(b.slug));
}

export function ownedSessionBusinesses<T extends { ownerId?: string }>(
  businesses: T[],
  clerkUserId: string,
): T[] {
  if (!clerkUserId) return [];
  return businesses.filter((b) => b.ownerId === clerkUserId);
}

export function pickPrimarySessionBusiness<T extends SessionBusinessLike>(
  businesses: T[],
  clerkUserId: string,
  email?: string | null,
  persistedBusinessId?: string | null,
): T | null {
  const allowed = filterSessionBusinesses(businesses, email);
  if (allowed.length === 0) return null;

  const owned = ownedSessionBusinesses(allowed, clerkUserId);
  const pool = owned.length > 0 ? owned : allowed;

  if (persistedBusinessId) {
    const fromPersisted = pool.find((b) => b.id === persistedBusinessId);
    if (fromPersisted) return fromPersisted;
  }

  return pool[0] ?? null;
}

export type PostLegalDestination = "/onboarding" | "/dashboard";

/** After platform legal — new founders always create a shop first. */
export function resolvePostLegalDestination(args: {
  businesses: SessionBusinessLike[];
  clerkUserId: string;
  email?: string | null;
}): PostLegalDestination {
  const allowed = filterSessionBusinesses(args.businesses, args.email);
  const owned = ownedSessionBusinesses(allowed, args.clerkUserId);
  if (owned.length === 0) return "/onboarding";

  const primary = owned[0]!;
  if (!isOnboardingAppUnlocked(primary.onboardingState ?? null, primary.vertical)) {
    return "/onboarding";
  }
  return "/dashboard";
}

export function shouldSkipLegalToDashboard(args: {
  businesses: SessionBusinessLike[];
  clerkUserId: string;
  email?: string | null;
}): boolean {
  return resolvePostLegalDestination(args) === "/dashboard";
}
