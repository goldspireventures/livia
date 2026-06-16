/**
 * Balance at visit — post-deposit settlement rail (child of commitment-gate).
 */
import type { OperationalPolicy } from "./operational-policy";
import {
  computeBalanceDueMinor,
  guestBalanceAtVisitLine,
  ownerBalanceAtVisitLine,
  resolveDepositPercentForService,
} from "./policy-evolution-program";

export {
  computeBalanceDueMinor,
  guestBalanceAtVisitLine,
  ownerBalanceAtVisitLine,
  resolveDepositPercentForService,
};

export function resolveTotalPaidMinor(booking: {
  depositPaidEurCents?: number | null;
  totalPaidEurCents?: number | null;
}): number {
  const deposit = booking.depositPaidEurCents ?? 0;
  const total = booking.totalPaidEurCents ?? 0;
  return Math.max(deposit, total);
}

export function computeBalanceDueFromBooking(args: {
  priceMinor: number;
  depositPaidEurCents?: number | null;
  totalPaidEurCents?: number | null;
}): number {
  return computeBalanceDueMinor({
    priceMinor: args.priceMinor,
    depositPaidMinor: args.depositPaidEurCents ?? 0,
    totalPaidMinor: resolveTotalPaidMinor(args),
  });
}

export function serviceDepositPercentHint(args: {
  operational: Pick<OperationalPolicy, "depositPercent" | "depositRequired">;
  service?: {
    category?: string | null;
    serviceKind?: string | null;
    name?: string | null;
    durationMinutes?: number;
  } | null;
}): string | null {
  if (!args.operational.depositRequired) return null;
  const effective = resolveDepositPercentForService({
    operational: args.operational,
    service: args.service,
  });
  const base = args.operational.depositPercent ?? 0;
  if (effective <= base) return null;
  return `Online bookings hold ${effective}% for this service (tenant default ${base}%).`;
}

/** Card-on-file rail — policy copy only until SetupIntent ships. */
export const CARD_ON_FILE_RAIL_COPY = {
  title: "Card on file (coming soon)",
  body: "Save a card after the first deposit so balance and rebooks need fewer links.",
  status: "planned" as const,
};

export function emergentTrustSettingsCopy(args: {
  enabled: boolean;
  acceptedAt?: string | null;
}): { headline: string; body: string; statusLabel: string } {
  if (args.enabled) {
    return {
      statusLabel: "Active",
      headline: "Trusted-client tier is on",
      body: "Guests marked Trusted skip the deposit gate. New guests still pay deposits — Liv auto-confirms when paid.",
    };
  }
  return {
    statusLabel: "Off until you accept",
    headline: "Trusted-client tier",
    body: "Liv proposes this after ~10 months of strong repeat-client data. You accept once — then Trusted guests skip deposits.",
  };
}

export function trustedClientToggleGuidance(_emergentTrustEnabled?: boolean): string {
  return "Trusted clients skip the online deposit requirement. First-time guests still follow your deposit rules.";
}
