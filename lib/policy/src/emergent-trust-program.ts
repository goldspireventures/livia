/**
 * Emergent trust programs — VIP-style service evolves from usage, never default-on.
 * Child of platform-build-hierarchy → emergent-trust.
 *
 * Year-one: collect signals with standard commitment gate.
 * Twin proposes a trusted-client tier when metrics justify it; owner accepts → policy patch.
 */
import type { TwinObservationDraft } from "./twin-observations";

export type EmergentTrustTierId = "trusted_client_deposit_waiver" | "priority_rebook_window";

export type EmergentTrustEligibilityInput = {
  /** Calendar months on platform (approx). */
  monthsActive: number;
  completedBookings: number;
  uniqueClients: number;
  depositCaptureRatePercent: number | null;
  repeatClientSharePercent: number | null;
  noShowRatePercent: number | null;
  /** Owner has not already enabled a trust program. */
  trustProgramActive: boolean;
};

export type EmergentTrustProposal = {
  tierId: EmergentTrustTierId;
  title: string;
  body: string;
  projectedBenefit: string;
  minimumMonthsActive: number;
  policyPatchSummary: string;
};

const MIN_MONTHS_ACTIVE = 10;
const MIN_COMPLETED_BOOKINGS = 80;
const MIN_UNIQUE_CLIENTS = 40;
const MIN_REPEAT_SHARE = 28;
const MAX_NO_SHOW_RATE = 8;

/** Whether metrics qualify for a Twin trust proposal (not auto-enable). */
export function evaluateEmergentTrustEligibility(
  input: EmergentTrustEligibilityInput,
): boolean {
  if (input.trustProgramActive) return false;
  if (input.monthsActive < MIN_MONTHS_ACTIVE) return false;
  if (input.completedBookings < MIN_COMPLETED_BOOKINGS) return false;
  if (input.uniqueClients < MIN_UNIQUE_CLIENTS) return false;
  if (input.repeatClientSharePercent != null && input.repeatClientSharePercent < MIN_REPEAT_SHARE) {
    return false;
  }
  if (input.noShowRatePercent != null && input.noShowRatePercent > MAX_NO_SHOW_RATE) {
    return false;
  }
  return true;
}

export function buildEmergentTrustProposal(
  input: EmergentTrustEligibilityInput,
): EmergentTrustProposal | null {
  if (!evaluateEmergentTrustEligibility(input)) return null;

  return {
    tierId: "trusted_client_deposit_waiver",
    title: "Trusted client tier — ready to consider",
    body: `After ${input.monthsActive} months, ${input.repeatClientSharePercent ?? "a strong"}% of revenue comes from repeat clients with low no-shows. A selective trusted tier can reduce friction for regulars without opening the door to first-timers.`,
    projectedBenefit:
      "Fewer deposit steps for proven regulars · faster rebooks · same protection for new guests",
    minimumMonthsActive: MIN_MONTHS_ACTIVE,
    policyPatchSummary:
      "Enable deposit waiver for clients tagged Trusted (manual or Liv-suggested) — new guests unchanged.",
  };
}

export function emergentTrustTwinObservation(
  input: EmergentTrustEligibilityInput,
): TwinObservationDraft | null {
  const proposal = buildEmergentTrustProposal(input);
  if (!proposal) return null;

  return {
    observationKey: "trust:emergent-tier-proposal",
    domain: "trust",
    title: proposal.title,
    body: proposal.body,
    confidence: input.monthsActive >= 12 ? "high" : "medium",
    evidence: [
      {
        type: "metric",
        id: "months_active",
        label: `${input.monthsActive} months on Livia`,
      },
      {
        type: "metric",
        id: "completed_bookings",
        label: `${input.completedBookings} completed visits`,
      },
      {
        type: "metric",
        id: "repeat_share",
        label: `${input.repeatClientSharePercent ?? "—"}% repeat revenue`,
      },
    ],
    href: "/customers",
  };
}
