import { describe, expect, it } from "vitest";
import {
  resolveOwnerHomeModuleLayout,
  shouldShowActivationWelcomeCard,
  shouldShowOwnerLivGuardrails,
  shouldShowOnboardingMaturityBanner,
  shouldShowRunningLateAffordance,
  shouldShowInboxContextRail,
  shouldShowStaffMyDayTimeline,
} from "../tenant-surface-density";

describe("tenant-surface-density", () => {
  it("collapses to all_clear when no inbox or pending", () => {
    expect(resolveOwnerHomeModuleLayout({ pendingCount: 0, openInboxCount: 0 })).toEqual({
      mode: "all_clear",
    });
  });

  it("single column pending when only pending", () => {
    expect(resolveOwnerHomeModuleLayout({ pendingCount: 2, openInboxCount: 0 })).toEqual({
      mode: "single",
      focus: "pending",
    });
  });

  it("dual when both signals", () => {
    expect(resolveOwnerHomeModuleLayout({ pendingCount: 1, openInboxCount: 3 })).toEqual({
      mode: "dual",
    });
  });

  it("guardrails when Liv act or early rung", () => {
    expect(shouldShowOwnerLivGuardrails({ livNeedsAttention: true, mandateRung: "R4" })).toBe(
      true,
    );
    expect(shouldShowOwnerLivGuardrails({ mandateRung: "R1" })).toBe(true);
    expect(shouldShowOwnerLivGuardrails({ mandateRung: "R4" })).toBe(false);
  });

  it("onboarding banner only before 100%", () => {
    expect(shouldShowOnboardingMaturityBanner(80)).toBe(true);
    expect(shouldShowOnboardingMaturityBanner(100)).toBe(false);
  });

  it("activation only with pending steps", () => {
    expect(shouldShowActivationWelcomeCard({ activationStepsPending: 1, dismissed: false })).toBe(
      true,
    );
    expect(shouldShowActivationWelcomeCard({ activationStepsPending: 0, dismissed: false })).toBe(
      false,
    );
  });

  it("running late only with bookings today", () => {
    expect(shouldShowRunningLateAffordance(0)).toBe(false);
    expect(shouldShowRunningLateAffordance(4)).toBe(true);
  });

  it("inbox context rail only with selection", () => {
    expect(shouldShowInboxContextRail(false)).toBe(false);
    expect(shouldShowInboxContextRail(true)).toBe(true);
  });

  it("staff timeline hidden for empty or single-booking day", () => {
    expect(shouldShowStaffMyDayTimeline({ todayBookingCount: 0, hasNextBooking: false })).toBe(
      false,
    );
    expect(shouldShowStaffMyDayTimeline({ todayBookingCount: 1, hasNextBooking: true })).toBe(
      false,
    );
    expect(shouldShowStaffMyDayTimeline({ todayBookingCount: 2, hasNextBooking: true })).toBe(
      true,
    );
    expect(shouldShowStaffMyDayTimeline({ todayBookingCount: 1, hasNextBooking: false })).toBe(
      true,
    );
  });
});
