/**
 * Twin observations — meaningful interpretations from facts + signals (Volume D layer 4).
 * Policy resolves drafts; API materializes to twin_observations table.
 */
import { emergentTrustTwinObservation } from "./emergent-trust-program";
import type { EmergentTrustEligibilityInput } from "./emergent-trust-program";

export type TwinObservationDomain =
  | "operational"
  | "revenue"
  | "relationship"
  | "trust"
  | "growth"
  | "capability";

export type TwinObservationEvidence = {
  type: string;
  id: string;
  label: string;
};

export type TwinObservationDraft = {
  observationKey: string;
  domain: TwinObservationDomain;
  title: string;
  body: string;
  confidence: "high" | "medium" | "low";
  evidence: TwinObservationEvidence[];
  href?: string;
};

export type TwinObservationResolveInput = {
  pendingCount: number;
  todayBookings: number;
  weekBookings: number;
  handedOffCount: number;
  sacredMetricMet: boolean;
  atRiskCount: number;
  lowFeedbackCount: number;
  commerceSignals: Array<{
    id: string;
    severity: string;
    title: string;
    body: string;
    href: string;
  }>;
  paymentCount30d: number;
  captureRatePercent: number | null;
  capabilityBlockerCount: number;
  capabilitySuspendedCount: number;
  capabilityScore: number;
  feedbackCount: number;
  avgFeedback: number | null;
  /** Optional — emergent trust tier proposal (never auto-enable). */
  emergentTrust?: EmergentTrustEligibilityInput;
};

/** Derive observation drafts from twin context facts — no DB in policy. */
export function resolveTwinObservationDrafts(
  input: TwinObservationResolveInput,
): TwinObservationDraft[] {
  const out: TwinObservationDraft[] = [];

  if (input.pendingCount >= 3) {
    out.push({
      observationKey: "operational:pending-backlog",
      domain: "operational",
      title: "Confirmation backlog building",
      body: `${input.pendingCount} bookings waiting on confirmation — guests may assume they're booked.`,
      confidence: input.pendingCount >= 5 ? "high" : "medium",
      evidence: [
        { type: "metric", id: "pending_count", label: `${input.pendingCount} pending` },
      ],
      href: "/bookings?status=pending",
    });
  }

  if (input.handedOffCount >= 2) {
    out.push({
      observationKey: "operational:inbox-handoffs",
      domain: "operational",
      title: "Inbox handoffs need owner eyes",
      body: `${input.handedOffCount} thread${input.handedOffCount === 1 ? "" : "s"} handed to you — response time affects conversion.`,
      confidence: "high",
      evidence: [
        { type: "metric", id: "handed_off_count", label: `${input.handedOffCount} handoffs` },
      ],
      href: "/inbox",
    });
  }

  if (
    input.paymentCount30d >= 3 &&
    input.captureRatePercent != null &&
    input.captureRatePercent < 70
  ) {
    out.push({
      observationKey: "revenue:low-capture-rate",
      domain: "revenue",
      title: "Capture rate below target",
      body: `Only ${input.captureRatePercent}% of expected revenue captured in 30d — deposits or card-on-file may need tuning.`,
      confidence: input.captureRatePercent < 50 ? "high" : "medium",
      evidence: [
        {
          type: "metric",
          id: "capture_rate",
          label: `${input.captureRatePercent}% capture`,
        },
        {
          type: "metric",
          id: "payment_count_30d",
          label: `${input.paymentCount30d} payments`,
        },
      ],
      href: "/settings?tab=billing",
    });
  }

  for (const signal of input.commerceSignals.filter((s) => s.severity !== "info")) {
    out.push({
      observationKey: `revenue:commerce-${signal.id}`,
      domain: "revenue",
      title: signal.title,
      body: signal.body,
      confidence: signal.severity === "act" ? "high" : "medium",
      evidence: [{ type: "commerce_signal", id: signal.id, label: signal.severity }],
      href: signal.href,
    });
  }

  if (input.capabilityBlockerCount > 0 && !input.sacredMetricMet) {
    out.push({
      observationKey: "capability:setup-blockers",
      domain: "capability",
      title: "Setup blockers on capability graph",
      body: `${input.capabilityBlockerCount} launch blocker${input.capabilityBlockerCount === 1 ? "" : "s"} — finish shop essentials (services, hours, booking link) before your first booking.`,
      confidence: "high",
      evidence: [
        {
          type: "metric",
          id: "capability_blockers",
          label: `${input.capabilityBlockerCount} blockers`,
        },
      ],
      href: "/toolkit",
    });
  }

  if (input.capabilitySuspendedCount > 0) {
    out.push({
      observationKey: "capability:suspended",
      domain: "capability",
      title: "Capabilities paused",
      body: `${input.capabilitySuspendedCount} capability${input.capabilitySuspendedCount === 1 ? " is" : "ies are"} suspended — resume when you're ready to use them again.`,
      confidence: "medium",
      evidence: [
        {
          type: "metric",
          id: "suspended_caps",
          label: `${input.capabilitySuspendedCount} suspended`,
        },
      ],
      href: "/settings",
    });
  }

  if (input.capabilityScore < 70 && input.capabilityScore > 0) {
    out.push({
      observationKey: "capability:low-health-score",
      domain: "capability",
      title: "Capability health needs attention",
      body: `Graph health at ${input.capabilityScore}% — finishing install and config unlocks more of the platform.`,
      confidence: "medium",
      evidence: [
        { type: "metric", id: "capability_score", label: `${input.capabilityScore}%` },
      ],
      href: "/toolkit",
    });
  }

  if (!input.sacredMetricMet && input.weekBookings === 0) {
    out.push({
      observationKey: "growth:activation-pending",
      domain: "growth",
      title: "First real booking still open",
      body: "V1 activation — one completed guest booking unlocks the full owner intelligence loop.",
      confidence: "high",
      evidence: [{ type: "activation", id: "sacred_metric", label: "not met" }],
      href: "/bookings/new",
    });
  }

  if (input.atRiskCount >= 2) {
    out.push({
      observationKey: "relationship:at-risk-guests",
      domain: "relationship",
      title: "Guests drifting away",
      body: `${input.atRiskCount} regulars haven't rebooked — a personal nudge often wins them back.`,
      confidence: "medium",
      evidence: [
        { type: "metric", id: "at_risk_count", label: `${input.atRiskCount} at risk` },
      ],
      href: "/customers",
    });
  }

  if (input.lowFeedbackCount >= 2) {
    out.push({
      observationKey: "trust:low-visit-scores",
      domain: "trust",
      title: "Recent visit scores dipped",
      body: `${input.lowFeedbackCount} low scores in the last two weeks — worth a quick read before they stack up.`,
      confidence: "medium",
      evidence: [
        { type: "metric", id: "low_feedback", label: `${input.lowFeedbackCount} low scores` },
      ],
      href: "/customers",
    });
  }

  if (input.feedbackCount >= 5 && input.avgFeedback != null && input.avgFeedback >= 4.5) {
    out.push({
      observationKey: "trust:strong-reputation",
      domain: "trust",
      title: "Visit feedback trending strong",
      body: `Average ${input.avgFeedback.toFixed(1)}/5 over 90 days — good moment to ask for public reviews.`,
      confidence: "medium",
      evidence: [
        { type: "metric", id: "avg_feedback", label: `${input.avgFeedback.toFixed(1)}/5` },
      ],
      href: "/settings?tab=public",
    });
  }

  if (input.emergentTrust) {
    const trustProposal = emergentTrustTwinObservation(input.emergentTrust);
    if (trustProposal) out.push(trustProposal);
  }

  return out;
}
