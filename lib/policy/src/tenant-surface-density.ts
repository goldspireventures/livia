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

export type OwnerHomeKpiId = "todayBookings" | "inboxHandoffs" | "toConfirm" | "completedToday";

/** KPI chips on owner home — only mount when they carry signal (no empty inbox / confirm rows). */
export function resolveOwnerHomeKpiChips(signals: {
  todayBookings: number;
  pendingCount: number;
  handedOffCount: number;
}): OwnerHomeKpiId[] {
  const chips: OwnerHomeKpiId[] = ["todayBookings"];
  if (Math.max(0, signals.handedOffCount) > 0) chips.push("inboxHandoffs");
  if (Math.max(0, signals.pendingCount) > 0) chips.push("toConfirm");
  if (Math.max(0, signals.todayBookings) > 0) chips.push("completedToday");
  return chips;
}

/** Owner briefing primary CTA — handoffs/pending only; never "open inbox" for Liv-only threads. */
export function resolveOwnerHomeBriefingCta(signals: {
  pendingCount: number;
  handedOffCount: number;
  fallbackHref: string;
  fallbackLabel: string;
}): { href: string; label: string } {
  const p = Math.max(0, signals.pendingCount);
  const h = Math.max(0, signals.handedOffCount);
  if (p > 0) {
    return {
      href: "/bookings?status=PENDING", // keep in sync with pending-booking-flow.PENDING_BOOKINGS_LIST_HREF
      label: p === 1 ? "Confirm 1 pending" : `Confirm ${p} pending`,
    };
  }
  if (h > 0) {
    return {
      href: "/inbox?lens=taken_over",
      label: h === 1 ? "Review 1 handoff" : `Review ${h} handoffs`,
    };
  }
  return { href: signals.fallbackHref, label: signals.fallbackLabel };
}

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

/** Floor ops — running late when there is day-of work on the calendar. */
export function shouldShowRunningLateAffordance(
  todayBookings: number,
  opts?: { pendingConfirmations?: number },
): boolean {
  return todayBookings > 0 || (opts?.pendingConfirmations ?? 0) > 0;
}

/** Max vertical shortcut tiles visible before "show more" (all verticals). */
export const VERTICAL_HOME_SHORTCUTS_VISIBLE = 3;

/** Inbox context rail — only when a thread is selected (avoids empty third column). */
export function shouldShowInboxContextRail(hasSelectedThread: boolean): boolean {
  return hasSelectedThread;
}

export type MedspaHubTab = "consents" | "intakes" | "waitlist";

/** Open the medspa hub tab with the most signal first. */
export function resolveMedspaHubDefaultTab(counts: {
  consents: number;
  intakes: number;
  waitlist: number;
}): MedspaHubTab {
  if (counts.consents > 0) return "consents";
  if (counts.intakes > 0) return "intakes";
  return "waitlist";
}

/** Chain glance — collapsed shop grid before expanding all locations. */
export const CHAIN_SHOPS_COLLAPSED_VISIBLE = 4;

export type ChainPulseLike = { pulseStatus: "ok" | "watch" | "act" };

export function chainShopsVisibleSlice<T extends ChainPulseLike>(
  shops: T[],
  showAll: boolean,
): { visible: T[]; hiddenCount: number } {
  if (showAll || shops.length <= CHAIN_SHOPS_COLLAPSED_VISIBLE) {
    return { visible: shops, hiddenCount: 0 };
  }
  const priority = shops.filter((s) => s.pulseStatus !== "ok");
  const ordered =
    priority.length > 0
      ? [...priority, ...shops.filter((s) => s.pulseStatus === "ok")]
      : shops;
  const visible = ordered.slice(0, CHAIN_SHOPS_COLLAPSED_VISIBLE);
  return { visible, hiddenCount: Math.max(0, shops.length - visible.length) };
}

/** Design proofs — collapse submit form when queue already has work. */
export function designProofsSubmitDefaultOpen(queueLength: number): boolean {
  return queueLength === 0;
}

/** Lifecycle page — static program cards only when a suggestion triggers them. */
export function shouldShowLifecycleProgramCard(args: {
  programId: "G3" | "G8";
  suggestions: Array<{ id: string }>;
  multiShop: boolean;
}): boolean {
  if (args.programId === "G3") {
    return args.suggestions.some((s) => s.id === "G3") || args.multiShop;
  }
  return args.suggestions.some((s) => s.id === "G8");
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
