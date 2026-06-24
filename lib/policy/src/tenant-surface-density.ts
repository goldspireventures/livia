/**
 * Platform-wide rules for how much appears on a tenant surface at once.
 * Surfaces stay thin: primary signal first, deferred modules behind disclosure or routes.
 */

import {
  ownerHomeCommerceNeedsAttention,
  ownerHomeUncapturedDemand,
  resolveCommerceOwnerBriefingCta,
} from "./commerce-briefing";
import { isConsultFirstVertical } from "./client-profile-policy";

export {
  ownerHomeCommerceNeedsAttention,
  ownerHomeUncapturedDemand,
  ownerHomeElevatedRefunds,
  resolveCommerceOwnerBriefingCta,
  ownerHomeLivSuggestions,
  type OwnerLivSuggestion,
  type CommerceBriefingInput,
} from "./commerce-briefing";

export type OwnerHomeModuleLayout =
  | { mode: "all_clear" }
  | { mode: "single"; focus: "inbox" | "pending" }
  | { mode: "dual" };

export type OwnerHomeSignals = {
  /** All PENDING bookings — includes guest deposit waits. */
  pendingCount: number;
  /** PENDING bookings where the studio must act (confirm / policy / manual). */
  studioPendingCount?: number;
  openInboxCount: number;
  livNeedsAttention?: boolean;
  mandateRung?: string;
  onboardingPercentComplete?: number | null;
};

export type OwnerHomeKpiId =
  | "todayBookings"
  | "inboxHandoffs"
  | "toConfirm"
  | "completedToday"
  | "atRiskGuests"
  | "lowFeedback"
  | "revenue30d"
  | "depositsGap"
  | "fillsDue"
  | "colourDayBlocks"
  | "medspaConsentQueue"
  | "newEnquiries"
  | "quotedEnquiries"
  | "staleQuotes";

export type OwnerHomeCommerceSignals = {
  capturedMinor30d?: number;
  captureRatePercent?: number | null;
  paymentCount30d?: number;
};

/** KPI chips on owner home — only mount when they carry signal (no empty inbox / confirm rows). */
export function resolveOwnerHomeKpiChips(
  signals: {
    todayBookings: number;
    pendingCount: number;
    studioPendingCount?: number;
    handedOffCount: number;
    inboxAttentionCount?: number;
    atRiskCount?: number;
    lowFeedbackCount?: number;
    capturedMinor30d?: number;
    paymentCount30d?: number;
    confirmedCount?: number;
    weekBookings?: number;
    fillsDueCount?: number;
    colourDayBlocks?: number;
    medspaConsentQueueCount?: number;
    newEnquiries?: number;
    quotedEnquiries?: number;
    staleQuotes?: number;
  },
  vertical?: string | null,
): OwnerHomeKpiId[] {
  if (isConsultFirstVertical(vertical)) {
    const chips: OwnerHomeKpiId[] = ["newEnquiries", "quotedEnquiries"];
    if (Math.max(0, signals.staleQuotes ?? 0) > 0) chips.push("staleQuotes");
    if (Math.max(0, signals.inboxAttentionCount ?? signals.handedOffCount) > 0) chips.push("inboxHandoffs");
    return chips;
  }

  const chips: OwnerHomeKpiId[] = ["todayBookings"];
  const studioPending = Math.max(0, signals.studioPendingCount ?? signals.pendingCount);
  if (Math.max(0, signals.colourDayBlocks ?? 0) > 0) chips.push("colourDayBlocks");
  if (Math.max(0, signals.medspaConsentQueueCount ?? 0) > 0) chips.push("medspaConsentQueue");
  if (Math.max(0, signals.fillsDueCount ?? 0) > 0) chips.push("fillsDue");
  if (Math.max(0, signals.inboxAttentionCount ?? signals.handedOffCount) > 0) chips.push("inboxHandoffs");
  if (studioPending > 0) chips.push("toConfirm");
  if (Math.max(0, signals.lowFeedbackCount ?? 0) > 0) chips.push("lowFeedback");
  if (Math.max(0, signals.atRiskCount ?? 0) > 0) chips.push("atRiskGuests");
  if (
    ownerHomeUncapturedDemand({
      paymentCount30d: signals.paymentCount30d,
      demandBookings: Math.max(0, signals.pendingCount) + Math.max(0, signals.confirmedCount ?? 0),
      weekBookings: signals.weekBookings,
    })
  ) {
    chips.push("depositsGap");
  } else if (Math.max(0, signals.capturedMinor30d ?? 0) > 0) {
    chips.push("revenue30d");
  }
  if (Math.max(0, signals.todayBookings) > 0) chips.push("completedToday");
  return chips;
}

/** Drop queue KPIs when operating pulse already surfaces inbox / pending counts. */
export function filterOwnerHomeKpiWhenOperatingPulseVisible(
  chips: OwnerHomeKpiId[],
  pulse?: { needsYou: number; guestAction: number } | null,
): OwnerHomeKpiId[] {
  if (!pulse) return chips;
  if (pulse.needsYou <= 0 && pulse.guestAction <= 0) return chips;
  return chips.filter((id) => id !== "inboxHandoffs" && id !== "toConfirm");
}

/** Briefing CTA duplicates operating pulse + queue panels when both are visible. */
export function shouldShowOwnerHomeBriefingCta(signals: {
  consultFirst?: boolean;
  operatingPulseActive?: boolean;
  moduleShowsQueueDetail?: boolean;
}): boolean {
  if (signals.consultFirst) return true;
  if (signals.operatingPulseActive && signals.moduleShowsQueueDetail) return false;
  return true;
}

/** Operating pulse header action duplicates inbox / pending preview panels. */
export function shouldShowOwnerOperatingPulsePrimaryAction(
  moduleLayout: OwnerHomeModuleLayout,
): boolean {
  return moduleLayout.mode === "all_clear";
}

/** Owner briefing primary CTA — ops queue first, then relationship/trust nudges. */
export function ownerHomeNeedsBriefingAction(signals: {
  pendingCount: number;
  studioPendingCount?: number;
  handedOffCount: number;
  inboxAttentionCount?: number;
  atRiskCount?: number;
  lowFeedbackCount?: number;
  captureRatePercent?: number | null;
  paymentCount30d?: number;
  confirmedCount?: number;
  weekBookings?: number;
}): boolean {
  const studioPending = Math.max(0, signals.studioPendingCount ?? signals.pendingCount);
  const inbox = Math.max(0, signals.inboxAttentionCount ?? signals.handedOffCount);
  return (
    studioPending > 0 ||
    inbox > 0 ||
    Math.max(0, signals.lowFeedbackCount ?? 0) > 0 ||
    Math.max(0, signals.atRiskCount ?? 0) > 0 ||
    ownerHomeCommerceNeedsAttention(signals) ||
    ownerHomeUncapturedDemand({
      paymentCount30d: signals.paymentCount30d,
      demandBookings: Math.max(0, signals.pendingCount) + Math.max(0, signals.confirmedCount ?? 0),
      weekBookings: signals.weekBookings,
    })
  );
}

/** Owner briefing primary CTA — ops queue first, then relationship/trust nudges. */
export function resolveOwnerHomeBriefingCta(signals: {
  pendingCount: number;
  studioPendingCount?: number;
  handedOffCount: number;
  inboxAttentionCount?: number;
  atRiskCount?: number;
  lowFeedbackCount?: number;
  captureRatePercent?: number | null;
  paymentCount30d?: number;
  confirmedCount?: number;
  weekBookings?: number;
  fallbackHref: string;
  fallbackLabel: string;
}): { href: string; label: string } {
  const studioPending = Math.max(0, signals.studioPendingCount ?? signals.pendingCount);
  const inbox = Math.max(0, signals.inboxAttentionCount ?? signals.handedOffCount);
  const low = Math.max(0, signals.lowFeedbackCount ?? 0);
  const atRisk = Math.max(0, signals.atRiskCount ?? 0);
  if (studioPending > 0) {
    return {
      href: "/bookings?status=PENDING&lens=needs_you",
      label: studioPending === 1 ? "Confirm 1 pending" : `Confirm ${studioPending} pending`,
    };
  }
  if (inbox > 0) {
    return {
      href: "/inbox?lens=needs_you",
      label: inbox === 1 ? "Review 1 inbox thread" : `Review ${inbox} inbox threads`,
    };
  }
  if (low > 0) {
    return {
      href: "/dashboard",
      label: low === 1 ? "Review 1 low score" : `Review ${low} low scores`,
    };
  }
  if (atRisk > 0) {
    return {
      href: "/customers",
      label: atRisk === 1 ? "Reconnect with 1 guest" : `Reconnect with ${atRisk} guests`,
    };
  }
  const commerceCta = resolveCommerceOwnerBriefingCta({
    captureRatePercent: signals.captureRatePercent,
    paymentCount30d: signals.paymentCount30d,
    demandBookings: studioPending + Math.max(0, signals.confirmedCount ?? 0),
    weekBookings: signals.weekBookings,
  });
  if (commerceCta) return commerceCta;
  return { href: signals.fallbackHref, label: signals.fallbackLabel };
}

/** Which inbox/pending panels to render — avoids two empty min-height cards. */
export function resolveOwnerHomeModuleLayout(signals: {
  /** Global pending (all buckets). */
  pendingCount: number;
  /** Studio-actionable pending — defaults to pendingCount when omitted. */
  studioPendingCount?: number;
  /** Inbox threads needing studio reply (not Liv-on / guest waits). */
  openInboxCount: number;
  /** Pending rows surfaced on Today home — defaults to pendingCount when omitted. */
  homePendingCount?: number;
  /** When true, pending is already on the today schedule strip — skip the pending card. */
  pendingSurfacedElsewhere?: boolean;
  /** Consult-first vertical — pipeline replaces booking pending modules. */
  consultFirst?: boolean;
  newEnquiries?: number;
  staleQuotes?: number;
  prepTasksDue?: number;
}): OwnerHomeModuleLayout {
  if (signals.consultFirst) {
    const n = Math.max(0, signals.newEnquiries ?? 0);
    const s = Math.max(0, signals.staleQuotes ?? 0);
    const p = Math.max(0, signals.prepTasksDue ?? 0);
    const i = Math.max(0, signals.openInboxCount);
    if (n === 0 && s === 0 && p === 0 && i === 0) return { mode: "all_clear" };
    return { mode: "single", focus: "inbox" };
  }

  const homePending = Math.max(0, signals.homePendingCount ?? signals.studioPendingCount ?? signals.pendingCount);
  const showHomePending = homePending > 0 && !signals.pendingSurfacedElsewhere;
  const i = Math.max(0, signals.openInboxCount);
  if (!showHomePending && i === 0) return { mode: "all_clear" };
  if (showHomePending && i === 0) return { mode: "single", focus: "pending" };
  if (!showHomePending && i > 0) return { mode: "single", focus: "inbox" };
  return { mode: "dual" };
}

/** Owner home pending card — only when there are rows to act on today. */
export function shouldShowOwnerPendingPanel(
  homePendingCount: number,
  loading?: boolean,
): boolean {
  return !!loading || homePendingCount > 0;
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

/** Today home — setup banner only while activation is in progress (not after first booking). */
export function shouldShowActivationMilestoneOnHome(activation: {
  status?: string | null;
} | null | undefined): boolean {
  return activation?.status === "in_progress";
}

export type MobileOwnerLivStackLayout = {
  showSectionLabel: boolean;
  showBriefing: boolean;
  showActBanner: boolean;
  showMoments: boolean;
  showIncidents: boolean;
  showProposals: boolean;
  showStuckContinuity: boolean;
  showIntelligenceHub: boolean;
  showVisitFeedback: boolean;
  showCapabilityReadiness: boolean;
  showLivOps: boolean;
  showActivityFeed: boolean;
  showVerticalInsights: boolean;
  showVerticalShortcuts: boolean;
};

/** Mobile owner Today — context-aware Liv depth (small surface). */
export function resolveMobileOwnerLivStack(signals: {
  useMorphToday: boolean;
  soloMode: boolean;
  pendingCount: number;
  handoffCount: number;
  onboardingPercent: number;
  isFirstRun: boolean;
  consultFirst?: boolean;
  newEnquiries?: number;
  staleQuotes?: number;
}): MobileOwnerLivStackLayout {
  if (signals.consultFirst) {
    return {
      showSectionLabel: false,
      showBriefing: false,
      showActBanner: false,
      showMoments: false,
      showIncidents: false,
      showProposals: false,
      showStuckContinuity: false,
      showIntelligenceHub: false,
      showVisitFeedback: false,
      showCapabilityReadiness: signals.onboardingPercent < 100,
      showLivOps: false,
      showActivityFeed: false,
      showVerticalInsights: false,
      showVerticalShortcuts: false,
    };
  }

  if (signals.isFirstRun) {
    return {
      showSectionLabel: false,
      showBriefing: false,
      showActBanner: false,
      showMoments: false,
      showIncidents: false,
      showProposals: false,
      showStuckContinuity: false,
      showIntelligenceHub: false,
      showVisitFeedback: false,
      showCapabilityReadiness: signals.onboardingPercent < 100,
      showLivOps: false,
      showActivityFeed: false,
      showVerticalInsights: false,
      showVerticalShortcuts: false,
    };
  }

  const needsAttention =
    signals.pendingCount > 0 || signals.handoffCount > 0 || signals.onboardingPercent < 100;

  if (signals.useMorphToday) {
    return {
      showSectionLabel: false,
      showBriefing: false,
      showActBanner: signals.handoffCount > 0,
      showMoments: signals.handoffCount > 0,
      showIncidents: signals.handoffCount > 0,
      showProposals: signals.pendingCount > 0,
      showStuckContinuity: false,
      showIntelligenceHub: false,
      showVisitFeedback: false,
      showCapabilityReadiness: signals.onboardingPercent < 100,
      showLivOps: signals.soloMode,
      showActivityFeed: false,
      showVerticalInsights: false,
      showVerticalShortcuts: false,
    };
  }

  return {
    showSectionLabel: needsAttention,
    showBriefing: true,
    showActBanner: signals.handoffCount > 0,
    showMoments: needsAttention,
    showIncidents: signals.handoffCount > 0,
    showProposals: signals.pendingCount > 0,
    showStuckContinuity: signals.handoffCount > 0,
    showIntelligenceHub: needsAttention,
    showVisitFeedback: needsAttention,
    showCapabilityReadiness: signals.onboardingPercent < 100,
    showLivOps: !signals.soloMode,
    showActivityFeed: false,
    showVerticalInsights: needsAttention,
    showVerticalShortcuts: false,
  };
}

/** Mobile owner Today — ritual header duplicates morph/constellation briefing. */
export function shouldShowMobileOwnerRitualHeader(signals: {
  useMorphToday: boolean;
  useConstellationToday: boolean;
  isFirstRun: boolean;
}): boolean {
  if (signals.isFirstRun) return false;
  return !signals.useMorphToday && !signals.useConstellationToday;
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

export type MedspaHubTab = "consents" | "intakes";

/** Open the medspa hub tab with the most signal first. Slot waitlist is Liv-managed on Today. */
export function resolveMedspaHubDefaultTab(counts: {
  consents: number;
  intakes: number;
}): MedspaHubTab {
  if (counts.consents > 0) return "consents";
  return "intakes";
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

/**
 * Owner/manager /dashboard — OwnerHomeRitual is the home surface.
 * Supplemental strips (second briefing, duplicate intel, capability deck) stay off.
 */
export function shouldShowOperatorDashboardSupplements(): boolean {
  return false;
}

/** Settings → Plan tab — commerce intel sits behind disclosure; plan card stays primary. */
export const SETTINGS_BILLING_COMMERCE_DEFAULT_OPEN = false;

/** Owner home — keep payments/Liv insights collapsed by default; owner opens when they want depth. */
export function shouldExpandOwnerHomeInsightsDisclosure(_signals: {
  hasIntelligenceContent?: boolean;
  commerceNeedsAttention?: boolean;
  pendingRemediationCount?: number;
}): boolean {
  return false;
}
