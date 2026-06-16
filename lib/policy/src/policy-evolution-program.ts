/**
 * Policy evolution — Twin/Liv proposals owners accept (audited patch), never silent auto-enable.
 * Children: emergent trust, deposit tuning, retail attach, Liv autonomy promotion.
 */
import type { OperationalPolicy } from "./operational-policy";
import type { LivMandate, LivAutonomyRung } from "./liv-mandate";
import { mergeLivMandate, parseLivMandate, promoteLivAutonomyIfEarned } from "./liv-mandate";
import {
  buildEmergentTrustProposal,
  evaluateEmergentTrustEligibility,
  type EmergentTrustEligibilityInput,
} from "./emergent-trust-program";

export type PolicyEvolutionProposalId =
  | "emergent_trust_tier"
  | "raise_deposit_capture"
  | "retail_attach_program"
  | "promote_liv_autonomy";

export type PolicyEvolutionProposal = {
  id: PolicyEvolutionProposalId;
  title: string;
  body: string;
  projectedBenefit: string;
  confidence: "high" | "medium" | "low";
  acceptLabel: string;
  href?: string;
  /** Machine patch applied on accept — operational policy partial. */
  operationalPatch?: Partial<OperationalPolicy>;
  /** Liv mandate patch on accept. */
  mandatePatch?: Partial<LivMandate>;
};

export type PolicyEvolutionResolveInput = {
  operational: OperationalPolicy;
  livMandate?: LivMandate | null;
  emergentTrust?: EmergentTrustEligibilityInput;
  captureRatePercent?: number | null;
  paymentCount30d?: number;
  retailAttachRatePercent?: number | null;
  livTrustScore?: number;
  completedBookings?: number;
};

export function resolvePolicyEvolutionProposals(
  input: PolicyEvolutionResolveInput,
): PolicyEvolutionProposal[] {
  const out: PolicyEvolutionProposal[] = [];
  const trustActive = Boolean(input.operational.emergentTrustProgram?.enabled);

  if (input.emergentTrust && !trustActive) {
    const proposal = buildEmergentTrustProposal(input.emergentTrust);
    if (proposal && evaluateEmergentTrustEligibility(input.emergentTrust)) {
      out.push({
        id: "emergent_trust_tier",
        title: proposal.title,
        body: proposal.body,
        projectedBenefit: proposal.projectedBenefit,
        confidence: input.emergentTrust.monthsActive >= 12 ? "high" : "medium",
        acceptLabel: "Enable trusted-client tier",
        href: "/customers",
        operationalPatch: {
          emergentTrustProgram: {
            enabled: true,
            acceptedAt: new Date().toISOString(),
            proposalKey: "emergent_trust_tier",
          },
        },
      });
    }
  }

  if (
    (input.paymentCount30d ?? 0) >= 3 &&
    input.captureRatePercent != null &&
    input.captureRatePercent < 65 &&
    input.operational.depositRequired
  ) {
    const nextPercent = Math.min(50, (input.operational.depositPercent ?? 20) + 10);
    if (nextPercent > (input.operational.depositPercent ?? 0)) {
      out.push({
        id: "raise_deposit_capture",
        title: "Raise deposit % to improve capture",
        body: `Capture rate is ${input.captureRatePercent}% — a higher securing deposit often reduces no-shows without more staff work.`,
        projectedBenefit: "Auto-confirm still applies when paid — you only change the gate height.",
        confidence: input.captureRatePercent < 50 ? "high" : "medium",
        acceptLabel: `Set deposit to ${nextPercent}%`,
        href: "/settings?tab=booking-rules",
        operationalPatch: { depositPercent: nextPercent },
      });
    }
  }

  if (
    input.retailAttachRatePercent != null &&
    input.retailAttachRatePercent < 15 &&
    (input.completedBookings ?? 0) >= 20
  ) {
    out.push({
      id: "retail_attach_program",
      title: "Turn on post-session retail prompts",
      body: `Retail attach is around ${input.retailAttachRatePercent}% — gentle product prompts after full sets and long appointments.`,
      projectedBenefit: "Incremental revenue without another system.",
      confidence: "medium",
      acceptLabel: "Turn on retail prompts",
      href: "/store",
      operationalPatch: {
        guestCare: {
          retailAftercareEnabled: true,
          aftercareEnabled: true,
        },
      },
    });
  }

  const mandate = input.livMandate ?? parseLivMandate(null);
  const promotion = promoteLivAutonomyIfEarned({
    mandate,
    trustScore: input.livTrustScore ?? mandate.trustScore,
    completedBookings: input.completedBookings ?? 0,
    captureRatePercent: input.captureRatePercent,
  });
  if (promotion) {
    out.push({
      id: "promote_liv_autonomy",
      title: `Promote Liv to ${promotion.nextRung}`,
      body: promotion.reason,
      projectedBenefit: promotion.benefit,
      confidence: promotion.confidence,
      acceptLabel: `Promote to ${promotion.nextRung}`,
      href: "/toolkit#liv-mandate",
      mandatePatch: { rung: promotion.nextRung, trustScore: promotion.nextTrustScore },
    });
  }

  return out;
}

export function applyPolicyEvolutionProposal(
  proposalId: PolicyEvolutionProposalId,
  proposals: PolicyEvolutionProposal[],
): {
  operationalPatch?: Partial<OperationalPolicy>;
  mandatePatch?: Partial<LivMandate>;
} | null {
  const p = proposals.find((x) => x.id === proposalId);
  if (!p) return null;
  return {
    operationalPatch: p.operationalPatch,
    mandatePatch: p.mandatePatch,
  };
}

/** Service-aware deposit % — colour / long blocks without per-SKU DB column. */
export function resolveDepositPercentForService(args: {
  operational: Pick<OperationalPolicy, "depositPercent" | "depositRequired">;
  service?: {
    category?: string | null;
    serviceKind?: string | null;
    name?: string | null;
    durationMinutes?: number;
  } | null;
}): number {
  if (!args.operational.depositRequired) return 0;
  const base = args.operational.depositPercent ?? 0;
  const cat = (args.service?.category ?? "").toLowerCase();
  const name = (args.service?.name ?? "").toLowerCase();
  if (cat.includes("colour") || cat.includes("color") || name.includes("colour") || name.includes("color")) {
    return Math.max(base, 50);
  }
  if ((args.service?.durationMinutes ?? 0) >= 180) {
    return Math.max(base, 30);
  }
  if (cat === "package" || name.includes("pack")) {
    return 100;
  }
  return base;
}

export function computeBalanceDueMinor(args: {
  priceMinor: number;
  depositPaidMinor: number;
  totalPaidMinor?: number;
}): number {
  const paid = args.totalPaidMinor ?? args.depositPaidMinor;
  return Math.max(0, args.priceMinor - paid);
}

export function ownerBalanceAtVisitLine(args: {
  priceMinor: number;
  depositPaidMinor: number;
  totalPaidMinor?: number;
  currency?: string;
  status: string;
}): string | null {
  const balance = computeBalanceDueMinor(args);
  if (balance <= 0) return null;
  const st = args.status.toUpperCase();
  if (st !== "CONFIRMED" && st !== "COMPLETED" && st !== "PENDING") return null;
  const amount = (balance / 100).toFixed(2);
  const sym = args.currency === "GBP" ? "£" : "€";
  return `Balance due at visit: ${sym}${amount} (deposit already held)`;
}

export function guestBalanceAtVisitLine(args: {
  priceMinor: number;
  depositPaidMinor: number;
  totalPaidMinor?: number;
  currency?: string;
}): string | null {
  const balance = computeBalanceDueMinor(args);
  if (balance <= 0) return null;
  const amount = (balance / 100).toFixed(2);
  const sym = args.currency === "GBP" ? "£" : "€";
  return `Balance of ${sym}${amount} due at your appointment — deposit already paid.`;
}

/** Event quote deposit credited toward first calendar booking (handoff primitive). */
export function quoteDepositCreditMinor(args: {
  quoteDepositPaidMinor: number;
  quoteSubtotalMinor: number;
}): number {
  if (args.quoteSubtotalMinor <= 0) return 0;
  return Math.min(args.quoteDepositPaidMinor, args.quoteSubtotalMinor);
}

/** Demo slugs — surface policy-evolution accept card without year-one metrics. */
export const DEMO_POLICY_EVOLUTION_SHOWCASE_SLUGS: ReadonlySet<string> = new Set([
  "luxe-salon-spa",
  "bloom-beauty-dublin",
  "harbour-wellness-cork",
]);

export function demoPolicyEvolutionProposalForShowcase(): PolicyEvolutionProposal {
  return {
    id: "emergent_trust_tier",
    title: "Trusted regulars — skip deposit",
    body: "Enable deposit waivers for clients you mark as trusted. New guests keep your standard deposit rules.",
    projectedBenefit: "Less friction for regulars without weakening first-booking protection.",
    confidence: "medium",
    acceptLabel: "Enable trusted-client tier",
    href: "/customers",
    operationalPatch: {
      emergentTrustProgram: {
        enabled: true,
        acceptedAt: new Date().toISOString(),
        proposalKey: "emergent_trust_tier_demo",
      },
    },
  };
}
