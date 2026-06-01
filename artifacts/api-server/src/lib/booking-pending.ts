/**
 * Machine-readable reasons for PENDING bookings — surfaced in UI and Liv copy.
 */
export const PENDING_REASONS = {
  AWAITING_STAFF_CONFIRM: "awaiting_staff_confirm",
  AWAITING_DEPOSIT: "awaiting_deposit",
  AWAITING_POLICY_REVIEW: "awaiting_policy_review",
  CREATED_BY_LIV: "created_by_liv",
  OWNER_MANUAL: "owner_manual",
  AWAITING_CONTINUITY: "awaiting_continuity",
} as const;

export type PendingReason = (typeof PENDING_REASONS)[keyof typeof PENDING_REASONS];

export function pendingReasonLabel(reason: string | null | undefined): string {
  switch (reason) {
    case PENDING_REASONS.AWAITING_STAFF_CONFIRM:
      return "Waiting for staff to confirm";
    case PENDING_REASONS.AWAITING_DEPOSIT:
      return "Waiting for deposit";
    case PENDING_REASONS.AWAITING_POLICY_REVIEW:
      return "Policy review required";
    case PENDING_REASONS.CREATED_BY_LIV:
      return "Liv created — confirm to finalize";
    case PENDING_REASONS.OWNER_MANUAL:
      return "Manual booking — confirm when ready";
    case PENDING_REASONS.AWAITING_CONTINUITY:
      return "Waiting for guest reply (photos or confirmation)";
    default:
      return "Pending — needs your confirmation";
  }
}

export function derivePendingReason(args: {
  source?: string | null;
  aiCanBookDirectly: boolean;
  depositRequired: boolean;
  depositPaidEurCents: number;
  autoConfirmWhenNoDeposit?: boolean;
  customerTrusted?: boolean;
  bookingContinuityEnabled?: boolean;
  customerHasPhone?: boolean;
  customerHasEmail?: boolean;
}): PendingReason | null {
  if (args.source === "owner-manual" || args.source === "walk-in") {
    return PENDING_REASONS.OWNER_MANUAL;
  }
  if (
    args.bookingContinuityEnabled !== false &&
    args.source === "web" &&
    (args.customerHasPhone || args.customerHasEmail)
  ) {
    return PENDING_REASONS.AWAITING_CONTINUITY;
  }
  if (args.customerTrusted && args.autoConfirmWhenNoDeposit !== false) {
    return null;
  }
  if (args.depositRequired && args.depositPaidEurCents <= 0) {
    return PENDING_REASONS.AWAITING_DEPOSIT;
  }
  if (!args.aiCanBookDirectly) {
    return PENDING_REASONS.AWAITING_STAFF_CONFIRM;
  }
  if (args.autoConfirmWhenNoDeposit === false) {
    return PENDING_REASONS.AWAITING_STAFF_CONFIRM;
  }
  if (
    args.source === "voice" ||
    args.source === "whatsapp" ||
    args.source === "sms" ||
    args.source === "web"
  ) {
    return PENDING_REASONS.CREATED_BY_LIV;
  }
  return null;
}
