/**
 * Registration + session routing — which business a signed-in user sees,
 * and where legal acceptance sends them. Prevents demo tenants and stale
 * cache from hijacking real founder sign-ups.
 */
import { listDemoWorldSlugs } from "./demo-subvertical-roster";
import { isOnboardingAppUnlocked } from "./onboarding-program";
import { blockingOnboardingActsForSession } from "./migration-fast-track-program";
import type { OnboardingState } from "./onboarding-state";

const DEMO_SESSION_EMAIL_DOMAINS = new Set(["livia.io", "demo.livia-hq.com"]);

export type SessionBusinessLike = {
  id: string;
  slug: string;
  ownerId?: string;
  vertical?: string | null;
  onboardingState?: OnboardingState | null;
  updatedAt?: string | Date | null;
};

function onboardingProgressScore(business: SessionBusinessLike): number {
  const state = business.onboardingState;
  if (!state) return 0;
  const blocking = blockingOnboardingActsForSession(business.vertical, state.checklist);
  const completed = new Set(state.completedActs ?? []);
  const blockingDone = blocking.filter((act) => completed.has(act)).length;
  return blockingDone * 1_000 + (state.percentComplete ?? 0);
}

/** Prefer unlocked shops, then most onboarding progress, then most recently touched. */
export function rankOwnedSessionBusinesses<T extends SessionBusinessLike>(
  businesses: T[],
): T[] {
  return [...businesses].sort((a, b) => {
    const aUnlocked = isOnboardingAppUnlocked(a.onboardingState ?? null, a.vertical);
    const bUnlocked = isOnboardingAppUnlocked(b.onboardingState ?? null, b.vertical);
    if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;

    const progressDelta = onboardingProgressScore(b) - onboardingProgressScore(a);
    if (progressDelta !== 0) return progressDelta;

    const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bUpdated - aUpdated;
  });
}

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
  // Demo roster accounts may land on provisioned worlds via staff membership.
  // Real founders only resolve owned shops — staff rows must not become the active tenant.
  const pool =
    owned.length > 0 ? owned : isDemoSessionEmail(email) ? allowed : [];

  if (persistedBusinessId) {
    const fromPersisted = pool.find((b) => b.id === persistedBusinessId);
    if (fromPersisted) return fromPersisted;
  }

  return rankOwnedSessionBusinesses(pool)[0] ?? null;
}

/**
 * Onboarding may only resume a shop the user owns — never a staff membership or demo world.
 * Prefer an owned shop that still has blocking onboarding acts incomplete.
 */
export function pickOnboardingResumeBusiness<T extends SessionBusinessLike>(
  businesses: T[],
  clerkUserId: string,
  email?: string | null,
): T | null {
  const allowed = filterSessionBusinesses(businesses, email);
  const owned = ownedSessionBusinesses(allowed, clerkUserId);
  if (owned.length === 0) return null;

  const incomplete = owned.filter(
    (b) => !isOnboardingAppUnlocked(b.onboardingState ?? null, b.vertical),
  );
  const pool = incomplete.length > 0 ? incomplete : owned;
  return rankOwnedSessionBusinesses(pool)[0] ?? null;
}

export type PostLegalDestination = "/onboarding" | "/dashboard";

/** Marketing get-started and founder handoffs — resume setup, not owner dashboard. */
export const FOUNDER_MARKETING_SIGN_IN_REDIRECT = "/onboarding";

function isSafeInAppRedirect(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

/**
 * Where to send a signed-in founder after Clerk auth.
 * Honors ?redirect_url= when safe; upgrades /onboarding → /dashboard when setup is complete.
 */
export function resolvePostSignInLandingPath(args: {
  businesses: SessionBusinessLike[];
  clerkUserId: string;
  email?: string | null;
  requestedRedirect?: string | null;
}): string {
  const sessionDest = resolvePostLegalDestination(args);
  const requested = args.requestedRedirect?.trim();
  if (requested && isSafeInAppRedirect(requested)) {
    if (requested === "/onboarding" || requested.startsWith("/onboarding?")) {
      return sessionDest === "/dashboard" ? "/dashboard" : requested;
    }
    return requested;
  }
  return sessionDest;
}

export {
  staffInviteWebRedirectUrl,
  staffInviteMobileRedirectUrl,
  staffInviteClerkRedirectUrl,
} from "./staff-invite-program";

/** After platform legal — new founders create a shop; invited staff skip founder onboarding. */
export function resolvePostLegalDestination(args: {
  businesses: SessionBusinessLike[];
  clerkUserId: string;
  email?: string | null;
}): PostLegalDestination {
  const allowed = filterSessionBusinesses(args.businesses, args.email);
  const owned = ownedSessionBusinesses(allowed, args.clerkUserId);
  if (owned.length === 0) {
    return allowed.length > 0 ? "/dashboard" : "/onboarding";
  }

  const ranked = rankOwnedSessionBusinesses(owned);
  if (ranked.some((b) => isOnboardingAppUnlocked(b.onboardingState ?? null, b.vertical))) {
    return "/dashboard";
  }
  return "/onboarding";
}

export function shouldSkipLegalToDashboard(args: {
  businesses: SessionBusinessLike[];
  clerkUserId: string;
  email?: string | null;
}): boolean {
  return resolvePostLegalDestination(args) === "/dashboard";
}
