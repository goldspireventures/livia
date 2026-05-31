/**
 * Platform-wide rules for how much appears on a tenant surface at once.
 * Surfaces stay thin: primary signal first, deferred modules behind disclosure or routes.
 */

export type OwnerHomeModuleLayout =
  | { mode: "all_clear" }
  | { mode: "single"; focus: "inbox" | "pending" }
  | { mode: "dual" };

export type OwnerHomeSignals = {
  pendingCount: number;
  openInboxCount: number;
  livNeedsAttention?: boolean;
  mandateRung?: string;
  onboardingPercentComplete?: number | null;
};

/** Which inbox/pending panels to render — avoids two empty min-height cards. */
export function resolveOwnerHomeModuleLayout(signals: {
  pendingCount: number;
  openInboxCount: number;
}): OwnerHomeModuleLayout {
  const p = Math.max(0, signals.pendingCount);
  const i = Math.max(0, signals.openInboxCount);
  if (p === 0 && i === 0) return { mode: "all_clear" };
  if (p > 0 && i === 0) return { mode: "single", focus: "pending" };
  if (p === 0 && i > 0) return { mode: "single", focus: "inbox" };
  return { mode: "dual" };
}

/** Liv mandate strip — only when attention needed or autonomy still early. */
export function shouldShowOwnerLivGuardrails(signals: {
  livNeedsAttention?: boolean;
  mandateRung?: string;
}): boolean {
  if (signals.livNeedsAttention) return true;
  const rung = signals.mandateRung ?? "R3";
  return rung === "R1" || rung === "R2";
}

/** Onboarding / setup banners — not after workspace is fully live. */
export function shouldShowOnboardingMaturityBanner(
  onboardingPercentComplete?: number | null,
): boolean {
  const pct = onboardingPercentComplete ?? 100;
  return pct < 100;
}

/** Activation checklist card — only while steps remain. */
export function shouldShowActivationWelcomeCard(args: {
  activationStepsPending: number;
  dismissed: boolean;
}): boolean {
  return args.activationStepsPending > 0 && !args.dismissed;
}

/** Floor ops affordances need at least one booking today. */
export function shouldShowRunningLateAffordance(todayBookings: number): boolean {
  return todayBookings > 0;
}

/** Max vertical shortcut tiles visible before "show more" (all verticals). */
export const VERTICAL_HOME_SHORTCUTS_VISIBLE = 3;

/** Inbox context rail — only when a thread is selected (avoids empty third column). */
export function shouldShowInboxContextRail(hasSelectedThread: boolean): boolean {
  return hasSelectedThread;
}

/** Staff my-day timeline — hide when only the hero booking exists or day is empty. */
export function shouldShowStaffMyDayTimeline(args: {
  todayBookingCount: number;
  hasNextBooking: boolean;
}): boolean {
  const n = Math.max(0, args.todayBookingCount);
  if (n === 0) return false;
  if (!args.hasNextBooking) return n > 0;
  return n > 1;
}

/** Default visible rows in staff timeline before expand (all verticals). */
export const STAFF_MY_DAY_TIMELINE_MAX_VISIBLE = 6;

/** Settings shop tab — secondary fields behind disclosure by default. */
export const SETTINGS_SHOP_SECONDARY_DEFAULT_OPEN = false;
