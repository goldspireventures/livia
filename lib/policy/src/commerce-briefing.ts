/**
 * Owner-facing commerce signals — shared across dashboard, mobile, Twin, and Liv.
 */
import { COMMERCE_BILLING_FIX_HREF } from "./commerce-signals";

export type CommerceBriefingInput = {
  capturedMinor30d?: number;
  captureRatePercent?: number | null;
  paymentCount30d?: number;
  refundMinor30d?: number;
  /** Demand without capture — pending + confirmed bookings */
  demandBookings?: number;
  weekBookings?: number;
  /** Tenant operational policy — suppresses "turn on deposits" when already enabled. */
  depositRequired?: boolean;
};

export type OwnerLivSuggestion = {
  id: string;
  label: string;
  href: string;
  priority: number;
};

/** Capture rate below target with enough attempts to matter. */
export function ownerHomeCommerceNeedsAttention(signals: {
  captureRatePercent?: number | null;
  paymentCount30d?: number;
}): boolean {
  return (
    signals.captureRatePercent != null &&
    signals.captureRatePercent < 70 &&
    Math.max(0, signals.paymentCount30d ?? 0) > 0
  );
}

/** Bookings exist but no payments captured in the window — deposits not wired. */
export function ownerHomeUncapturedDemand(signals: {
  paymentCount30d?: number;
  demandBookings?: number;
  weekBookings?: number;
}): boolean {
  if (Math.max(0, signals.paymentCount30d ?? 0) > 0) return false;
  const demand = Math.max(0, signals.demandBookings ?? 0);
  const week = Math.max(0, signals.weekBookings ?? 0);
  return demand >= 2 || week >= 5;
}

export function ownerHomeElevatedRefunds(signals: {
  refundMinor30d?: number;
  capturedMinor30d?: number;
}): boolean {
  const captured = Math.max(0, signals.capturedMinor30d ?? 0);
  const refunds = Math.max(0, signals.refundMinor30d ?? 0);
  if (captured <= 0 || refunds <= 0) return false;
  return refunds / captured >= 0.15;
}

/** Primary owner briefing CTA from commerce when ops queue is clear. */
export function resolveCommerceOwnerBriefingCta(signals: CommerceBriefingInput): {
  href: string;
  label: string;
} | null {
  if (ownerHomeUncapturedDemand(signals)) {
    return signals.depositRequired
      ? { href: COMMERCE_BILLING_FIX_HREF, label: "Complete a test deposit" }
      : { href: COMMERCE_BILLING_FIX_HREF, label: "Turn on deposits" };
  }
  if (ownerHomeCommerceNeedsAttention(signals)) {
    return { href: COMMERCE_BILLING_FIX_HREF, label: "Improve payment capture" };
  }
  if (ownerHomeElevatedRefunds(signals)) {
    return { href: COMMERCE_BILLING_FIX_HREF, label: "Review refunds" };
  }
  return null;
}

/** Up to three Liv nudges for owner home / mobile today tab. */
export function ownerHomeLivSuggestions(signals: {
  pendingCount: number;
  studioPendingCount?: number;
  handedOffCount: number;
  inboxAttentionCount?: number;
  atRiskCount?: number;
  lowFeedbackCount?: number;
  commerce?: CommerceBriefingInput;
}): OwnerLivSuggestion[] {
  const out: OwnerLivSuggestion[] = [];
  const studioPending = Math.max(0, signals.studioPendingCount ?? signals.pendingCount);
  const inbox = Math.max(0, signals.inboxAttentionCount ?? signals.handedOffCount);
  const atRisk = Math.max(0, signals.atRiskCount ?? 0);
  const low = Math.max(0, signals.lowFeedbackCount ?? 0);
  const c = signals.commerce ?? {};

  if (studioPending > 0) {
    out.push({
      id: "pending",
      label: studioPending === 1 ? "Confirm 1 pending" : `Confirm ${studioPending} pending`,
      href: "/bookings?status=PENDING&lens=needs_you",
      priority: 1,
    });
  }
  if (inbox > 0) {
    out.push({
      id: "handoff",
      label: inbox === 1 ? "Review 1 inbox thread" : `Review ${inbox} inbox threads`,
      href: "/inbox?lens=needs_you",
      priority: 2,
    });
  }
  if (low > 0) {
    out.push({
      id: "feedback",
      label: low === 1 ? "Review 1 low score" : `Review ${low} low scores`,
      href: "/dashboard",
      priority: 3,
    });
  }
  if (atRisk > 0) {
    out.push({
      id: "at-risk",
      label: atRisk === 1 ? "Reconnect with 1 guest" : `Reconnect with ${atRisk} guests`,
      href: "/customers",
      priority: 4,
    });
  }
  const commerceCta = resolveCommerceOwnerBriefingCta({
    ...c,
    demandBookings: c.demandBookings ?? studioPending + Math.max(0, (signals as { confirmedCount?: number }).confirmedCount ?? 0),
  });
  if (commerceCta) {
    out.push({
      id: "commerce",
      label: commerceCta.label,
      href: commerceCta.href,
      priority: 5,
    });
  }

  return out.sort((a, b) => a.priority - b.priority).slice(0, 3);
}
