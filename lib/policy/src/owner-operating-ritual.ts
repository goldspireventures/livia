/**
 * Owner operating ritual — Liv handled vs needs you vs guest completing.
 * Child of platform-build-hierarchy → owner-operating-ritual.
 */
import { PENDING_REASON_CODES } from "./booking-experience-copy";

export type OperatingAttentionBucket = "liv_handling" | "needs_you" | "guest_action";

/** Classify a PENDING booking by who must act next. */
export function classifyPendingBookingAttention(
  pendingReason: string | null | undefined,
): OperatingAttentionBucket {
  const reason = pendingReason?.trim();
  if (!reason) return "liv_handling";

  switch (reason) {
    case PENDING_REASON_CODES.AWAITING_DEPOSIT:
    case PENDING_REASON_CODES.AWAITING_CONTINUITY:
      return "guest_action";
    case PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM:
    case PENDING_REASON_CODES.AWAITING_POLICY_REVIEW:
    case PENDING_REASON_CODES.OWNER_MANUAL:
      return "needs_you";
    case PENDING_REASON_CODES.CREATED_BY_LIV:
      return "liv_handling";
    default:
      return "liv_handling";
  }
}

export type PendingAttentionCounts = Record<OperatingAttentionBucket, number>;

/** Count PENDING bookings by who must act next — guest/deposit waits are not studio queue. */
export function countPendingBookingsByAttention(
  bookings: Array<{ pendingReason?: string | null }>,
): PendingAttentionCounts {
  const out: PendingAttentionCounts = {
    liv_handling: 0,
    needs_you: 0,
    guest_action: 0,
  };
  for (const b of bookings) {
    out[classifyPendingBookingAttention(b.pendingReason)] += 1;
  }
  return out;
}

/** Bookings where the studio must confirm, review policy, or intervene. */
export function studioPendingBookingCount(
  bookings: Array<{ pendingReason?: string | null }>,
): number {
  return countPendingBookingsByAttention(bookings).needs_you;
}

/** Bookings waiting on guest deposit, continuity, or reply — not an inbox/studio action. */
export function guestActionPendingBookingCount(
  bookings: Array<{ pendingReason?: string | null }>,
): number {
  return countPendingBookingsByAttention(bookings).guest_action;
}

export type OperatingPulseCounts = {
  livHandling: number;
  needsYou: number;
  guestAction: number;
  inboxNeedsYou: number;
  inboxHandedOff: number;
  inboxLivHandling: number;
};

export type OperatingPulseView = OperatingPulseCounts & {
  headline: string;
  subline: string;
  primaryHref: string;
  primaryLabel: string;
};

export function resolveOperatingPulse(input: {
  pendingBookings: Array<{ pendingReason?: string | null }>;
  inboxNeedsYou: number;
  inboxHandedOff: number;
  inboxLivHandling: number;
}): OperatingPulseView {
  let guestAction = 0;
  let needsYou = 0;
  let livHandling = 0;

  for (const b of input.pendingBookings) {
    const bucket = classifyPendingBookingAttention(b.pendingReason);
    if (bucket === "guest_action") guestAction += 1;
    else if (bucket === "needs_you") needsYou += 1;
    else livHandling += 1;
  }

  const inboxNeedsYou = input.inboxNeedsYou + input.inboxHandedOff;
  const totalNeedsYou = needsYou + inboxNeedsYou;
  const totalLiv =
    livHandling + input.inboxLivHandling + guestAction;

  let headline: string;
  let subline: string;
  let primaryHref = "/dashboard";
  let primaryLabel = "View today";

  if (totalNeedsYou > 0) {
    headline = `${totalNeedsYou} need${totalNeedsYou === 1 ? "s" : ""} you`;
    const parts: string[] = [];
    if (needsYou > 0) parts.push(`${needsYou} booking${needsYou === 1 ? "" : "s"}`);
    if (inboxNeedsYou > 0) parts.push(`${inboxNeedsYou} inbox`);
    subline =
      parts.length > 0
        ? `${parts.join(" · ")} — Liv is handling everything else.`
        : "Liv is handling everything else.";
    primaryHref =
      needsYou > 0 ? "/bookings?status=PENDING&lens=needs_you" : "/inbox?lens=needs_you";
    primaryLabel = needsYou > 0 ? "Review bookings" : "Open inbox";
  } else if (guestAction > 0) {
    headline = "Liv is running the floor";
    subline = `${guestAction} guest${guestAction === 1 ? "" : "s"} completing deposit or reply — no action needed.`;
    primaryHref = "/bookings?status=PENDING&lens=guest_action";
    primaryLabel = "View waiting";
  } else {
    headline = "Liv has the floor";
    subline = "No confirmations or inbox handoffs need you right now.";
    primaryHref = "/bookings";
    primaryLabel = "View calendar";
  }

  return {
    livHandling: totalLiv,
    needsYou: totalNeedsYou,
    guestAction,
    inboxNeedsYou: input.inboxNeedsYou,
    inboxHandedOff: input.inboxHandedOff,
    inboxLivHandling: input.inboxLivHandling,
    headline,
    subline,
    primaryHref,
    primaryLabel,
  };
}

export function operatingPulsePanelCopy(bucket: OperatingAttentionBucket): {
  label: string;
  description: string;
} {
  switch (bucket) {
    case "guest_action":
      return {
        label: "Guest completing",
        description: "Deposit link sent or waiting on reply — Liv follows up.",
      };
    case "needs_you":
      return {
        label: "Needs you",
        description: "Human queue, policy review, or manual hold.",
      };
    default:
      return {
        label: "Liv handling",
        description: "Automated channels — no owner action required.",
      };
  }
}
