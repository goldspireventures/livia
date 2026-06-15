import type { OnboardingChecklist, OnboardingState } from "./onboarding-state";
import { activationStepsFromState } from "./onboarding-program";

export type ActivationStatus = "activated" | "in_progress" | "not_started";

export type BusinessActivationSnapshot = {
  status: ActivationStatus;
  /** Sacred V1 metric — first booking received */
  sacredMetricMet: boolean;
  firstBookingAt: string | null;
  firstBookingId: string | null;
  activationSource: OnboardingChecklist["activationSource"] | null;
  businessCreatedAt: string;
  timeToFirstBookingMs: number | null;
  timeToFirstBookingLabel: string | null;
  activationStepsComplete: number;
  activationStepsTotal: number;
  paymentsConnected: boolean;
};

export function computeTimeToFirstBookingMs(
  businessCreatedAt: string | Date,
  firstBookingAt: string | Date,
): number {
  const start = typeof businessCreatedAt === "string" ? Date.parse(businessCreatedAt) : businessCreatedAt.getTime();
  const end = typeof firstBookingAt === "string" ? Date.parse(firstBookingAt) : firstBookingAt.getTime();
  return Math.max(0, end - start);
}

export function formatActivationDuration(ms: number): string {
  if (ms < 60_000) return "under a minute";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} hr`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

/** Owner lifecycle funnel — sacred metric + setup progress copy. */
export const ACTIVATION_FUNNEL_COPY = {
  title: "Activation checklist",
  sacredMetricLabel: "First booking received",
  sacredMetricMet: "Activated — your first booking is on the books.",
  sacredMetricPending: "Sacred metric — get your first booking to activate Livia for real.",
  timeToFirstBooking: "Time to first booking",
  stepsComplete: "Setup steps complete",
} as const;

export function resolveActivationStatus(args: {
  sacredMetricMet: boolean;
  activationStepsComplete: number;
}): ActivationStatus {
  if (args.sacredMetricMet) return "activated";
  if (args.activationStepsComplete > 0) return "in_progress";
  return "not_started";
}

export function buildBusinessActivationSnapshot(args: {
  businessCreatedAt: string;
  onboardingState: OnboardingState | null | undefined;
  vertical?: string | null;
  firstBookingAt?: string | null;
  firstBookingId?: string | null;
  paymentsConnected?: boolean;
}): BusinessActivationSnapshot {
  const checklist = args.onboardingState?.checklist;
  const steps = activationStepsFromState(args.onboardingState, args.vertical);
  const activationStepsComplete = steps.filter((s) => s.done).length;
  const sacredMetricMet = checklist?.testBooking === true;

  const resolvedFirstBookingAt = checklist?.firstBookingAt ?? args.firstBookingAt ?? null;
  const resolvedFirstBookingId = checklist?.firstBookingId ?? args.firstBookingId ?? null;

  const timeToFirstBookingMs =
    resolvedFirstBookingAt && args.businessCreatedAt
      ? computeTimeToFirstBookingMs(args.businessCreatedAt, resolvedFirstBookingAt)
      : null;

  return {
    status: resolveActivationStatus({ sacredMetricMet, activationStepsComplete }),
    sacredMetricMet,
    firstBookingAt: resolvedFirstBookingAt,
    firstBookingId: resolvedFirstBookingId,
    activationSource: checklist?.activationSource ?? null,
    businessCreatedAt: args.businessCreatedAt,
    timeToFirstBookingMs,
    timeToFirstBookingLabel:
      timeToFirstBookingMs != null ? formatActivationDuration(timeToFirstBookingMs) : null,
    activationStepsComplete,
    activationStepsTotal: steps.length,
    paymentsConnected: args.paymentsConnected ?? checklist?.billingStarted === true,
  };
}
