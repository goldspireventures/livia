import assert from "node:assert/strict";
import {
  resolveOwnerHomeBriefingCta,
  resolveOwnerHomeKpiChips,
  resolveOwnerHomeModuleLayout,
  shouldShowActivationWelcomeCard,
  shouldShowOwnerLivGuardrails,
  shouldShowOnboardingMaturityBanner,
  shouldShowRunningLateAffordance,
  shouldShowInboxContextRail,
  shouldShowStaffMyDayTimeline,
  resolveMedspaHubDefaultTab,
  chainShopsVisibleSlice,
  designProofsSubmitDefaultOpen,
} from "../tenant-surface-density";

assert.deepEqual(resolveOwnerHomeKpiChips({ todayBookings: 0, pendingCount: 0, handedOffCount: 0 }), [
  "todayBookings",
]);

assert.deepEqual(
  resolveOwnerHomeKpiChips({ todayBookings: 5, pendingCount: 2, handedOffCount: 1 }),
  ["todayBookings", "inboxHandoffs", "toConfirm", "completedToday"],
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

assert.equal(shouldShowOwnerLivGuardrails({ livNeedsAttention: true, mandateRung: "R4" }), true);
assert.equal(shouldShowOwnerLivGuardrails({ mandateRung: "R1" }), true);
assert.equal(shouldShowOwnerLivGuardrails({ mandateRung: "R4" }), false);

assert.equal(shouldShowOnboardingMaturityBanner(80), true);
assert.equal(shouldShowOnboardingMaturityBanner(100), false);

assert.equal(shouldShowActivationWelcomeCard({ activationStepsPending: 1, dismissed: false }), true);
assert.equal(shouldShowActivationWelcomeCard({ activationStepsPending: 0, dismissed: false }), false);

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
