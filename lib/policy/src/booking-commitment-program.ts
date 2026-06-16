/**
 * Booking commitment gate — one model for "what must be true before the slot locks?"
 *
 * Appointment verticals: percent deposit (tenant policy) unless prepaid package credit
 * or a zero-price consult SKU applies. Event vendors use consult-first milestones
 * (`consult-first-payment.ts`) — not this module.
 */
import type { BusinessVertical } from "./types";
import type { OperationalPolicy } from "./operational-policy";
import { depositAppliesForBooking } from "./operational-policy";

export type CommitmentRail =
  | "appointment_deposit"
  | "package_credit"
  | "milestone_quote"
  | "proof_then_deposit";

export type VerticalCommitmentProfile = {
  rail: CommitmentRail;
  depositRequired: boolean;
  depositPercent: number;
  /** Owner-facing one-liner for onboarding copilot. */
  marketNote: string;
};

/** Real-world deposit norms — seed defaults only; tenant can override. */
export const VERTICAL_COMMITMENT_PROFILES: Record<BusinessVertical, VerticalCommitmentProfile> = {
  hair: {
    rail: "appointment_deposit",
    depositRequired: true,
    depositPercent: 20,
    marketNote: "Colour and long blocks often run 30–50% — raise % in booking rules.",
  },
  beauty: {
    rail: "appointment_deposit",
    depositRequired: true,
    depositPercent: 25,
    marketNote: "Lash and nail fills commonly hold 25–50% for new clients.",
  },
  "body-art": {
    rail: "proof_then_deposit",
    depositRequired: true,
    depositPercent: 30,
    marketNote: "Consult is free; session deposit locks after design proof approval.",
  },
  wellness: {
    rail: "appointment_deposit",
    depositRequired: true,
    depositPercent: 50,
    marketNote: "Spas often take half upfront; package credits skip the deposit gate.",
  },
  fitness: {
    rail: "package_credit",
    depositRequired: true,
    depositPercent: 100,
    marketNote: "PT and classes: pay in full to hold, or burn a session from a pack.",
  },
  medspa: {
    rail: "appointment_deposit",
    depositRequired: true,
    depositPercent: 30,
    marketNote: "Consults are free; treatment slots use a securing deposit.",
  },
  "allied-health": {
    rail: "appointment_deposit",
    depositRequired: false,
    depositPercent: 0,
    marketNote: "Most clinics bill after visit — deposits off by default; turn on if you prepay.",
  },
  "pet-grooming": {
    rail: "appointment_deposit",
    depositRequired: true,
    depositPercent: 20,
    marketNote: "Standard hold deposit; balance at pickup.",
  },
  "automotive-detailing": {
    rail: "appointment_deposit",
    depositRequired: true,
    depositPercent: 30,
    marketNote: "Long bay jobs — securing deposit scales with service price.",
  },
  "event-vendors": {
    rail: "milestone_quote",
    depositRequired: true,
    depositPercent: 30,
    marketNote: "Quote milestones — see Event Operator deposit settings, not calendar %.",
  },
};

export function verticalCommitmentProfile(vertical: BusinessVertical): VerticalCommitmentProfile {
  return VERTICAL_COMMITMENT_PROFILES[vertical];
}

/** Verticals where prepaid session packs satisfy the commitment gate. */
export const PACKAGE_CREDIT_VERTICALS: ReadonlySet<BusinessVertical> = new Set([
  "wellness",
  "fitness",
]);

export function verticalSupportsPackageCreditCommitment(
  vertical: BusinessVertical | string | null | undefined,
): boolean {
  return vertical != null && PACKAGE_CREDIT_VERTICALS.has(vertical as BusinessVertical);
}

/** Free consult / assessment SKUs — no % deposit on €0 price. */
export function serviceWaivesPercentDeposit(args: {
  priceMinor: number;
  serviceKind?: string | null;
  category?: string | null;
}): boolean {
  if (args.priceMinor <= 0) return true;
  const kind = (args.serviceKind ?? "").toLowerCase();
  if (kind === "consult" || kind === "assessment" || kind === "patch_test") return true;
  const cat = (args.category ?? "").toLowerCase();
  if (cat === "consult" || cat.includes("consult")) return true;
  return false;
}

/**
 * Whether a percent deposit must be collected before auto-confirm.
 * Package credit and zero-price consults satisfy commitment without Stripe.
 */
export function depositAppliesForBookingContext(args: {
  operational: Pick<
    OperationalPolicy,
    "depositRequired" | "depositPercent" | "emergentTrustProgram"
  >;
  service?: {
    priceMinor?: number;
    serviceKind?: string | null;
    category?: string | null;
  } | null;
  packageCreditApplied?: boolean;
  /** When emergent trust program is on, trusted regulars skip the deposit gate. */
  customerTrusted?: boolean;
}): boolean {
  if (args.packageCreditApplied) return false;
  if (args.customerTrusted && args.operational.emergentTrustProgram?.enabled) {
    return false;
  }
  if (!depositAppliesForBooking(args.operational)) return false;
  if (
    args.service &&
    serviceWaivesPercentDeposit({
      priceMinor: args.service.priceMinor ?? 0,
      serviceKind: args.service.serviceKind,
      category: args.service.category,
    })
  ) {
    return false;
  }
  return true;
}

export function recommendedDepositPolicyForVertical(vertical: BusinessVertical): {
  depositRequired: boolean;
  depositPercent: number;
} {
  const p = verticalCommitmentProfile(vertical);
  return { depositRequired: p.depositRequired, depositPercent: p.depositPercent };
}

/** Unified owner guidance when awaiting deposit — Liv auto-confirms on payment. */
export function depositCollectionGuidance(
  vertical?: string | null,
  category?: string | null,
): string {
  const v = (vertical ?? category ?? "").toLowerCase();
  if (v === "wellness" || v === "fitness") {
    return "Send the deposit link — Liv confirms the session when payment clears.";
  }
  if (v === "body-art") {
    return "Send the session deposit link — Liv locks the slot when payment clears.";
  }
  return "Send the deposit link — Liv confirms automatically when payment clears.";
}
