/**
 * Liv Arrival — single conductor for post-onboarding setup (Phase A).
 * Suppresses duplicate go-live / activation banners; one Liv-guided beat at a time.
 */
import type { BusinessActivationSnapshot } from "./activation-metrics";
import { goLiveRibbonFromActivation } from "./go-live-program";
import type { OnboardingState } from "./onboarding-state";

export const PLATFORM_TOUR_DISMISSED_KEY = "livia.platformTour.dismissed.v1";
export const LIV_ARRIVAL_DISMISSED_KEY = "livia.livArrival.dismissed";
export const LIV_ARRIVAL_INTRODUCED_KEY = "livia.livArrival.introduced";

export const LIV_ARRIVAL_COPY = {
  eyebrow: "Liv",
  introHeadline: "Hi — I'm Liv.",
  introSubline: "I'll walk you through what's left, one step at a time.",
  showMe: "Show me",
  doneNext: "Done — next",
  exploreAlone: "Explore on my own",
  stepOf: (current: number, total: number) => `Step ${current} of ${total}`,
  minimizedLabel: (current: number, total: number) => `Liv · ${current}/${total}`,
  completeTitle: "You're set up",
  completeBody: "Your first booking is the finish line — share your link anytime from Settings.",
} as const;

export type LivArrivalGateArgs = {
  activation?: Pick<BusinessActivationSnapshot, "sacredMetricMet"> | null;
  onboardingState?: OnboardingState | null;
  vertical?: string | null;
  slug?: string | null;
  isDemoTenant?: boolean;
  isOwnerOrAdmin?: boolean;
  arrivalDismissed?: boolean;
  platformTourDismissed?: boolean;
};

/** Owner is still on the sacred-metric path (first booking not received). */
export function isOnLivArrivalPath(args: LivArrivalGateArgs): boolean {
  if (!args.isOwnerOrAdmin) return false;
  if (args.isDemoTenant) return false;
  if (args.activation?.sacredMetricMet === true) return false;
  return goLiveRibbonFromActivation({
    activation: args.activation,
    onboardingState: args.onboardingState,
    vertical: args.vertical,
    slug: args.slug,
    isDemoTenant: args.isDemoTenant,
  });
}

/** Hide go-live ribbon, activation welcome, maturity banner while on arrival path. */
export function shouldSuppressDuplicateSetupBanners(args: LivArrivalGateArgs): boolean {
  return isOnLivArrivalPath(args);
}

/** Floating Liv conductor — after platform tour, until skip or sacred metric. */
export function shouldShowLivArrivalConductor(args: LivArrivalGateArgs): boolean {
  if (!isOnLivArrivalPath(args)) return false;
  if (args.arrivalDismissed) return false;
  if (args.platformTourDismissed === false) return false;
  return true;
}

export function readLivArrivalDismissed(
  businessId: string,
  storage: Pick<Storage, "getItem"> = typeof globalThis !== "undefined"
    ? globalThis.localStorage
    : { getItem: () => null },
): boolean {
  try {
    const raw = storage.getItem(LIV_ARRIVAL_DISMISSED_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, boolean>;
    return map[businessId] === true;
  } catch {
    return false;
  }
}

export function writeLivArrivalDismissed(
  businessId: string,
  storage: Storage = typeof globalThis !== "undefined" ? globalThis.localStorage : (null as unknown as Storage),
): void {
  try {
    const raw = storage.getItem(LIV_ARRIVAL_DISMISSED_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    map[businessId] = true;
    storage.setItem(LIV_ARRIVAL_DISMISSED_KEY, JSON.stringify(map));
  } catch {
    // ignore quota / private mode
  }
}

export function isPlatformTourDismissed(
  storage: Pick<Storage, "getItem"> = typeof globalThis !== "undefined"
    ? globalThis.localStorage
    : { getItem: () => null },
): boolean {
  try {
    return storage.getItem(PLATFORM_TOUR_DISMISSED_KEY) === "1";
  } catch {
    return true;
  }
}

export function readLivArrivalIntroduced(
  businessId: string,
  storage: Pick<Storage, "getItem"> = typeof globalThis !== "undefined"
    ? globalThis.localStorage
    : { getItem: () => null },
): boolean {
  try {
    const raw = storage.getItem(LIV_ARRIVAL_INTRODUCED_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, boolean>;
    return map[businessId] === true;
  } catch {
    return false;
  }
}

export function writeLivArrivalIntroduced(
  businessId: string,
  storage: Storage = typeof globalThis !== "undefined" ? globalThis.localStorage : (null as unknown as Storage),
): void {
  try {
    const raw = storage.getItem(LIV_ARRIVAL_INTRODUCED_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    map[businessId] = true;
    storage.setItem(LIV_ARRIVAL_INTRODUCED_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}
