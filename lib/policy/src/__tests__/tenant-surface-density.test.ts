import assert from "node:assert/strict";
import {
  ownerHomeNeedsBriefingAction,
  resolveOwnerHomeBriefingCta,
  resolveOwnerHomeKpiChips,
  resolveOwnerHomeModuleLayout,
  shouldShowOwnerPendingPanel,
  shouldShowActivationWelcomeCard,
  shouldShowActivationMilestoneOnHome,
  resolveMobileOwnerLivStack,
  shouldShowMobileOwnerRitualHeader,
  shouldShowOwnerLivGuardrails,
  shouldShowOnboardingMaturityBanner,
  shouldShowRunningLateAffordance,
  shouldShowInboxContextRail,
  shouldShowStaffMyDayTimeline,
  resolveMedspaHubDefaultTab,
  chainShopsVisibleSlice,
  designProofsSubmitDefaultOpen,
  shouldShowOperatorDashboardSupplements,
  shouldExpandOwnerHomeInsightsDisclosure,
} from "../tenant-surface-density";

assert.deepEqual(resolveOwnerHomeKpiChips({ todayBookings: 0, pendingCount: 0, handedOffCount: 0 }), [
  "todayBookings",
]);

assert.deepEqual(
  resolveOwnerHomeKpiChips({ todayBookings: 5, pendingCount: 2, handedOffCount: 1 }),
  ["todayBookings", "inboxHandoffs", "toConfirm", "completedToday"],
);

assert.ok(
  resolveOwnerHomeKpiChips({
    todayBookings: 3,
    pendingCount: 0,
    handedOffCount: 0,
    colourDayBlocks: 2,
  }).includes("colourDayBlocks"),
);
assert.ok(
  resolveOwnerHomeKpiChips({
    todayBookings: 3,
    pendingCount: 0,
    handedOffCount: 0,
    medspaConsentQueueCount: 1,
  }).includes("medspaConsentQueue"),
);

assert.deepEqual(
  resolveOwnerHomeKpiChips({
    todayBookings: 3,
    pendingCount: 0,
    handedOffCount: 0,
    atRiskCount: 2,
    lowFeedbackCount: 1,
    capturedMinor30d: 12500,
  }),
  ["todayBookings", "lowFeedback", "atRiskGuests", "revenue30d", "completedToday"],
);

assert.deepEqual(
  resolveOwnerHomeBriefingCta({
    pendingCount: 0,
    handedOffCount: 0,
    paymentCount30d: 0,
    confirmedCount: 3,
    weekBookings: 2,
    fallbackHref: "/bookings",
    fallbackLabel: "View calendar",
  }),
  { href: "/settings?tab=billing#commerce-fix", label: "Turn on deposits" },
);

assert.deepEqual(
  resolveOwnerHomeBriefingCta({
    pendingCount: 0,
    handedOffCount: 0,
    captureRatePercent: 55,
    paymentCount30d: 4,
    fallbackHref: "/bookings",
    fallbackLabel: "View calendar",
  }),
  { href: "/settings?tab=billing#commerce-fix", label: "Improve payment capture" },
);

assert.equal(
  ownerHomeNeedsBriefingAction({ pendingCount: 0, handedOffCount: 0, captureRatePercent: 55, paymentCount30d: 4 }),
  true,
);

assert.equal(
  ownerHomeNeedsBriefingAction({ pendingCount: 0, handedOffCount: 0, atRiskCount: 2 }),
  true,
);
assert.equal(ownerHomeNeedsBriefingAction({ pendingCount: 0, handedOffCount: 0 }), false);

assert.deepEqual(
  resolveOwnerHomeBriefingCta({
    pendingCount: 0,
    handedOffCount: 0,
    lowFeedbackCount: 2,
    fallbackHref: "/bookings",
    fallbackLabel: "View calendar",
  }),
  { href: "/dashboard", label: "Review 2 low scores" },
);

assert.deepEqual(
  resolveOwnerHomeBriefingCta({
    pendingCount: 2,
    handedOffCount: 0,
    fallbackHref: "/bookings",
    fallbackLabel: "View calendar",
  }),
  { href: "/bookings?status=PENDING", label: "Confirm 2 pending" },
);

assert.deepEqual(
  resolveOwnerHomeBriefingCta({
    pendingCount: 0,
    handedOffCount: 1,
    fallbackHref: "/bookings",
    fallbackLabel: "View calendar",
  }),
  { href: "/inbox?lens=taken_over", label: "Review 1 handoff" },
);

assert.deepEqual(
  resolveOwnerHomeBriefingCta({
    pendingCount: 0,
    handedOffCount: 0,
    fallbackHref: "/bookings",
    fallbackLabel: "View calendar",
  }),
  { href: "/bookings", label: "View calendar" },
);

assert.deepEqual(resolveOwnerHomeModuleLayout({ pendingCount: 0, openInboxCount: 0 }), {
  mode: "all_clear",
});

assert.deepEqual(resolveOwnerHomeModuleLayout({ pendingCount: 2, openInboxCount: 0 }), {
  mode: "single",
  focus: "pending",
});

assert.deepEqual(resolveOwnerHomeModuleLayout({ pendingCount: 1, openInboxCount: 3 }), {
  mode: "dual",
});

assert.deepEqual(
  resolveOwnerHomeModuleLayout({
    pendingCount: 2,
    openInboxCount: 3,
    homePendingCount: 2,
    pendingSurfacedElsewhere: true,
  }),
  { mode: "single", focus: "inbox" },
);

assert.deepEqual(
  resolveOwnerHomeModuleLayout({ pendingCount: 4, openInboxCount: 0, homePendingCount: 0 }),
  { mode: "all_clear" },
);

assert.deepEqual(
  resolveOwnerHomeModuleLayout({ pendingCount: 4, openInboxCount: 2, homePendingCount: 0 }),
  { mode: "single", focus: "inbox" },
);

assert.equal(shouldShowOwnerPendingPanel(0, false), false);
assert.equal(shouldShowOwnerPendingPanel(0, true), true);
assert.equal(shouldShowOwnerPendingPanel(2, false), true);

assert.equal(shouldShowOwnerLivGuardrails({ livNeedsAttention: true, mandateRung: "R4" }), true);
assert.equal(shouldShowOwnerLivGuardrails({ mandateRung: "R1" }), true);
assert.equal(shouldShowOwnerLivGuardrails({ mandateRung: "R4" }), false);

assert.equal(shouldShowOnboardingMaturityBanner(80), true);
assert.equal(shouldShowOnboardingMaturityBanner(100), false);

assert.equal(shouldShowActivationWelcomeCard({ activationStepsPending: 1, dismissed: false }), true);
assert.equal(shouldShowActivationWelcomeCard({ activationStepsPending: 0, dismissed: false }), false);

assert.equal(shouldShowActivationMilestoneOnHome({ status: "in_progress" }), true);
assert.equal(shouldShowActivationMilestoneOnHome({ status: "activated" }), false);
assert.equal(shouldShowActivationMilestoneOnHome({ status: "not_started" }), false);

const quietMorph = resolveMobileOwnerLivStack({
  useMorphToday: true,
  soloMode: false,
  pendingCount: 0,
  handoffCount: 0,
  onboardingPercent: 100,
  isFirstRun: false,
});
assert.equal(quietMorph.showBriefing, false);
assert.equal(quietMorph.showActivityFeed, false);

assert.equal(
  shouldShowMobileOwnerRitualHeader({ useMorphToday: true, useConstellationToday: false, isFirstRun: false }),
  false,
);

assert.equal(shouldShowRunningLateAffordance(0), false);
assert.equal(shouldShowRunningLateAffordance(0, { pendingConfirmations: 2 }), true);
assert.equal(shouldShowRunningLateAffordance(4), true);

assert.equal(shouldShowInboxContextRail(false), false);
assert.equal(shouldShowInboxContextRail(true), true);

assert.equal(resolveMedspaHubDefaultTab({ consents: 2, intakes: 1, waitlist: 5 }), "consents");
assert.equal(resolveMedspaHubDefaultTab({ consents: 0, intakes: 1, waitlist: 5 }), "intakes");
assert.equal(resolveMedspaHubDefaultTab({ consents: 0, intakes: 0, waitlist: 0 }), "waitlist");

const shops = [
  { pulseStatus: "ok" as const },
  { pulseStatus: "ok" as const },
  { pulseStatus: "ok" as const },
  { pulseStatus: "ok" as const },
  { pulseStatus: "ok" as const },
  { pulseStatus: "act" as const },
];
const slice = chainShopsVisibleSlice(shops, false);
assert.equal(slice.visible.length, 4);
assert.equal(slice.hiddenCount, 2);

assert.equal(designProofsSubmitDefaultOpen(0), true);
assert.equal(designProofsSubmitDefaultOpen(3), false);

assert.equal(shouldShowStaffMyDayTimeline({ todayBookingCount: 0, hasNextBooking: false }), false);
assert.equal(shouldShowStaffMyDayTimeline({ todayBookingCount: 1, hasNextBooking: true }), false);
assert.equal(shouldShowStaffMyDayTimeline({ todayBookingCount: 2, hasNextBooking: true }), true);
assert.equal(shouldShowStaffMyDayTimeline({ todayBookingCount: 1, hasNextBooking: false }), true);

assert.equal(shouldShowOperatorDashboardSupplements(), false);
assert.equal(
  shouldExpandOwnerHomeInsightsDisclosure({ hasIntelligenceContent: false, commerceNeedsAttention: true }),
  false,
);
assert.equal(
  shouldExpandOwnerHomeInsightsDisclosure({
    hasIntelligenceContent: true,
    commerceNeedsAttention: true,
    pendingRemediationCount: 0,
  }),
  false,
);
