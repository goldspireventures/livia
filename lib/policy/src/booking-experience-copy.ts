import type { BusinessVertical } from "./types";
import { businessVocabulary, resolveVerticalKey } from "./vocabulary";

/** Machine-readable PENDING reasons — keep in sync with api-server `booking-pending.ts`. */
export const PENDING_REASON_CODES = {
  AWAITING_STAFF_CONFIRM: "awaiting_staff_confirm",
  AWAITING_DEPOSIT: "awaiting_deposit",
  AWAITING_POLICY_REVIEW: "awaiting_policy_review",
  CREATED_BY_LIV: "created_by_liv",
  OWNER_MANUAL: "owner_manual",
  AWAITING_CONTINUITY: "awaiting_continuity",
} as const;

export type PendingReasonCode =
  (typeof PENDING_REASON_CODES)[keyof typeof PENDING_REASON_CODES];

/** Resolve stored or inferred machine reason while status is PENDING (hub for API + UI). */
export function resolvePendingReasonCode(args: {
  status: string;
  pendingReason?: string | null;
  source?: string | null;
  aiCanBookDirectly?: boolean;
  depositRequired?: boolean;
  depositPaidEurCents?: number;
  autoConfirmWhenNoDeposit?: boolean;
  customerTrusted?: boolean;
  bookingContinuityEnabled?: boolean;
  customerHasPhone?: boolean;
  customerHasEmail?: boolean;
}): PendingReasonCode | null {
  const status = (args.status ?? "").toUpperCase();
  if (status !== "PENDING") return null;
  const stored = args.pendingReason?.trim();
  if (stored && Object.values(PENDING_REASON_CODES).includes(stored as PendingReasonCode)) {
    return stored as PendingReasonCode;
  }
  if (stored) return stored as PendingReasonCode;

  const source = args.source ?? "web";
  if (source === "owner-manual" || source === "walk-in") {
    return PENDING_REASON_CODES.OWNER_MANUAL;
  }
  if (
    args.bookingContinuityEnabled !== false &&
    source === "web" &&
    (args.customerHasPhone || args.customerHasEmail)
  ) {
    return PENDING_REASON_CODES.AWAITING_CONTINUITY;
  }
  if (args.depositRequired && (args.depositPaidEurCents ?? 0) <= 0) {
    return PENDING_REASON_CODES.AWAITING_DEPOSIT;
  }
  if (args.aiCanBookDirectly === false) {
    return PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM;
  }
  if (args.autoConfirmWhenNoDeposit === false) {
    return PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM;
  }
  if (
    source === "voice" ||
    source === "whatsapp" ||
    source === "sms" ||
    source === "instagram" ||
    source === "messenger" ||
    source === "web"
  ) {
    return PENDING_REASON_CODES.CREATED_BY_LIV;
  }
  return PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM;
}

const DEFAULT_PENDING_LABELS: Record<string, string> = {
  [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]: "Waiting for staff to confirm",
  [PENDING_REASON_CODES.AWAITING_DEPOSIT]: "Waiting for deposit",
  [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]: "Policy review required",
  [PENDING_REASON_CODES.CREATED_BY_LIV]: "Liv created — confirm to finalize",
  [PENDING_REASON_CODES.OWNER_MANUAL]: "Manual booking — confirm when ready",
  [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
    "Waiting for guest reply (photos or confirmation)",
};

const WELLNESS_PENDING_LABELS: Record<string, string> = {
  [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
    "Therapist or reception needs to confirm this session",
  [PENDING_REASON_CODES.AWAITING_DEPOSIT]: "Session deposit due before confirming",
  [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]:
    "Cancellation window — review before confirming",
  [PENDING_REASON_CODES.CREATED_BY_LIV]:
    "Liv scheduled this session — confirm to hold the room",
  [PENDING_REASON_CODES.OWNER_MANUAL]:
    "Walk-in or manual hold — confirm when the room is ready",
  [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
    "Waiting for guest reply (health notes or arrival confirmation)",
};

const DEFAULT_PENDING_GUIDANCE: Record<string, string> = {
  [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
    "Assign or confirm the provider, then approve — the client gets a confirmation once you approve.",
  [PENDING_REASON_CODES.AWAITING_DEPOSIT]:
    "Send the deposit link or mark paid, then approve so the slot stays held.",
  [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
    "Guest hasn't confirmed photos or details yet — follow up in inbox or approve if you're satisfied.",
  [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]:
    "Review against your shop policy. Adjust time or service if needed, then approve.",
  [PENDING_REASON_CODES.CREATED_BY_LIV]:
    "Liv matched availability to the request — approve if time and service look right.",
  [PENDING_REASON_CODES.OWNER_MANUAL]:
    "Confirm time, service, and client, then approve.",
};

const WELLNESS_PENDING_GUIDANCE: Record<string, string> = {
  [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
    "Assign a therapist or room, then confirm — the guest gets a confirmation once locked.",
  [PENDING_REASON_CODES.AWAITING_DEPOSIT]:
    "Collect the prepaid deposit, then confirm so the room stays held.",
  [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
    "Health notes or arrival confirmation still outstanding — follow up or confirm when ready.",
  [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]:
    "Check your cancellation and reschedule policy for this package or voucher, then confirm.",
  [PENDING_REASON_CODES.CREATED_BY_LIV]:
    "Liv matched room availability — confirm if therapist and session length look right.",
  [PENDING_REASON_CODES.OWNER_MANUAL]:
    "Confirm room, session, and guest, then approve.",
};

function pendingLabelMap(vertical: BusinessVertical): Record<string, string> {
  if (vertical === "wellness") return WELLNESS_PENDING_LABELS;
  if (vertical === "beauty") return BEAUTY_PENDING_LABELS;
  return DEFAULT_PENDING_LABELS;
}

function pendingGuidanceMap(vertical: BusinessVertical): Record<string, string> {
  if (vertical === "wellness") return WELLNESS_PENDING_GUIDANCE;
  if (vertical === "beauty") return BEAUTY_PENDING_GUIDANCE;
  return DEFAULT_PENDING_GUIDANCE;
}

/** Owner-facing label for API `pendingReason` — vertical-aware. */
export function pendingReasonLabel(
  reason: string | null | undefined,
  vertical?: string | null,
  category?: string | null,
): string {
  const key = resolveVerticalKey(vertical, category);
  const map = pendingLabelMap(key);
  if (reason && map[reason]) return map[reason];
  if (reason?.trim()) return reason.replace(/_/g, " ");
  if (key === "wellness") return "Session pending — confirm to hold the room";
  if (key === "beauty") return "Appointment pending — confirm to hold the slot";
  return "Pending — needs your confirmation";
}

/** Mobile / approvals — what happened and what to do next. */
export function pendingApprovalGuidance(
  reason: string | null | undefined,
  vertical?: string | null,
  category?: string | null,
): string {
  const key = resolveVerticalKey(vertical, category);
  const map = pendingGuidanceMap(key);
  if (reason && map[reason]) return map[reason];
  if (key === "wellness") {
    return "Confirm, reschedule, or follow up when a room hold or intake rule needs you.";
  }
  if (key === "beauty") {
    return "Confirm, reschedule, or follow up when a deposit, fill, or patch-test rule needs you.";
  }
  return "Approve, edit, or follow up when a booking rule needs a human.";
}

/** Why Liv did not auto-confirm — policy-driven, shown on owner surfaces. */
export function livPendingAutoConfirmBlocker(
  reason: string | null | undefined,
  vertical?: string | null,
  category?: string | null,
): string | null {
  if (!reason?.trim()) return null;
  const key = resolveVerticalKey(vertical, category);
  const slot = key === "wellness" ? "session" : "appointment";
  switch (reason) {
    case PENDING_REASON_CODES.AWAITING_DEPOSIT:
      return `Liv can't auto-confirm — your policy requires a deposit before this ${slot} locks.`;
    case PENDING_REASON_CODES.AWAITING_CONTINUITY:
      return "Liv is waiting for the client to reply in the continuity thread before confirming.";
    case PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM:
      return `Liv won't auto-confirm — staff must approve this ${slot} per your booking rules.`;
    case PENDING_REASON_CODES.AWAITING_POLICY_REVIEW:
      return "Liv flagged this for policy review — confirm once you've checked your rules.";
    case PENDING_REASON_CODES.CREATED_BY_LIV:
      return `Liv matched the slot but your rules still need owner confirmation.`;
    case PENDING_REASON_CODES.OWNER_MANUAL:
      return null;
    default:
      return null;
  }
}

export type BookingExperienceCopy = {
  detailPageTitle: string;
  detailPageSubtitle: string;
  backToListAria: string;
  partyCardTitle: string;
  clientFieldLabel: string;
  serviceFieldLabel: string;
  mediaCardTitle: string;
  continuityPanelTitle: string;
  continuityOpenThread: string;
  noGuestLabel: string;
  noServiceLabel: string;
  statusSectionTitle: string;
  notesDisclosureTitle: string;
  notesDisclosureDescription: string;
  listGuidedBookingTitle: string;
  listGuidedBookingDescription: string;
  listQuickAddLabel: string;
  listEmptyTitle: string;
  listEmptyPendingCta: string;
  statusFilterNoShow: string;
  toastStatusUpdated: (status: string) => string;
  statusActions: {
    CONFIRMED: string;
    COMPLETED: string;
    CANCELLED: string;
    NO_SHOW: string;
  };
};

const DEFAULT_EXPERIENCE: BookingExperienceCopy = {
  detailPageTitle: "Booking detail",
  detailPageSubtitle: "Status, continuity, and next actions",
  backToListAria: "Back to bookings",
  partyCardTitle: "Client & service",
  clientFieldLabel: "Customer",
  serviceFieldLabel: "Service",
  mediaCardTitle: "Reference photos",
  continuityPanelTitle: "Booking continuity",
  continuityOpenThread: "Open thread",
  noGuestLabel: "No customer",
  noServiceLabel: "No service",
  statusSectionTitle: "Status",
  notesDisclosureTitle: "Notes",
  notesDisclosureDescription: "Internal booking notes",
  listGuidedBookingTitle: "Guided booking",
  listGuidedBookingDescription: "Step-by-step booking with Liv",
  listQuickAddLabel: "Quick add",
  listEmptyTitle: "No bookings found",
  listEmptyPendingCta: "New booking",
  statusFilterNoShow: "No Show",
  toastStatusUpdated: (status) => `Booking ${status.toLowerCase()}`,
  statusActions: {
    CONFIRMED: "Confirm",
    COMPLETED: "Mark Complete",
    CANCELLED: "Cancel",
    NO_SHOW: "No Show",
  },
};

const BEAUTY_EXPERIENCE: BookingExperienceCopy = {
  detailPageTitle: "Appointment detail",
  detailPageSubtitle: "Treatment, client notes, and confirm or reschedule",
  backToListAria: "Back to schedule",
  partyCardTitle: "Client & treatment",
  clientFieldLabel: "Client",
  serviceFieldLabel: "Treatment",
  mediaCardTitle: "Reference photos",
  continuityPanelTitle: "Client messages",
  continuityOpenThread: "Open thread",
  noGuestLabel: "No client on file",
  noServiceLabel: "No treatment selected",
  statusSectionTitle: "Status",
  notesDisclosureTitle: "Studio notes",
  notesDisclosureDescription: "Lash map, allergies, patch test — internal only",
  listGuidedBookingTitle: "Guided booking",
  listGuidedBookingDescription: "Pick treatment, artist, and time with Liv",
  listQuickAddLabel: "Quick book",
  listEmptyTitle: "No appointments in this view",
  listEmptyPendingCta: "New appointment",
  statusFilterNoShow: "No-show",
  toastStatusUpdated: (status) => `Appointment ${status.toLowerCase()}`,
  statusActions: {
    CONFIRMED: "Confirm",
    COMPLETED: "Complete",
    CANCELLED: "Cancel",
    NO_SHOW: "No-show",
  },
};

const BEAUTY_PENDING_LABELS: Record<string, string> = {
  [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
    "Artist or front desk needs to confirm this appointment",
  [PENDING_REASON_CODES.AWAITING_DEPOSIT]: "Deposit due before confirming",
  [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]: "Review cancellation policy before confirming",
  [PENDING_REASON_CODES.CREATED_BY_LIV]: "Liv proposed this slot — confirm to hold it",
  [PENDING_REASON_CODES.OWNER_MANUAL]: "Manual hold — confirm when the station is ready",
  [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
    "Waiting for client reply (patch test or style reference)",
};

const BEAUTY_PENDING_GUIDANCE: Record<string, string> = {
  [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
    "Assign the artist, then confirm — the client gets a confirmation once locked.",
  [PENDING_REASON_CODES.AWAITING_DEPOSIT]:
    "Send the deposit link or mark paid, then confirm the slot.",
  [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
    "Patch test or style reference still outstanding — follow up or confirm when ready.",
  [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]:
    "Check fill vs full-set policy and cancel window, then confirm.",
  [PENDING_REASON_CODES.CREATED_BY_LIV]:
    "Liv matched availability from the enquiry — confirm if treatment and duration look right.",
  [PENDING_REASON_CODES.OWNER_MANUAL]:
    "Confirm treatment, artist, and time, then approve.",
};

const WELLNESS_EXPERIENCE: BookingExperienceCopy = {
  detailPageTitle: "Session detail",
  detailPageSubtitle: "Room slot, guest intake, and confirm or reschedule",
  backToListAria: "Back to rooms",
  partyCardTitle: "Guest & session",
  clientFieldLabel: "Guest",
  serviceFieldLabel: "Session",
  mediaCardTitle: "Intake attachments",
  continuityPanelTitle: "Guest messages",
  continuityOpenThread: "Open guest thread",
  noGuestLabel: "No guest on file",
  noServiceLabel: "No session selected",
  statusSectionTitle: "Session status",
  notesDisclosureTitle: "Studio notes",
  notesDisclosureDescription: "Internal notes for therapists and reception",
  listGuidedBookingTitle: "Guided session booking",
  listGuidedBookingDescription: "Pick room, therapist, and session length with Liv",
  listQuickAddLabel: "Quick hold",
  listEmptyTitle: "No sessions in this view",
  listEmptyPendingCta: "Hold a room",
  statusFilterNoShow: "Did not arrive",
  toastStatusUpdated: (status) =>
    status === "NO_SHOW" ? "Marked did not arrive" : `Session ${status.toLowerCase()}`,
  statusActions: {
    CONFIRMED: "Confirm session",
    COMPLETED: "Session complete",
    CANCELLED: "Release room",
    NO_SHOW: "Did not arrive",
  },
};

/** W4 booking list + detail + continuity — operator copy. */
export function bookingExperienceCopy(
  vertical?: string | null,
  category?: string | null,
): BookingExperienceCopy {
  const key = resolveVerticalKey(vertical, category);
  if (key === "wellness") return WELLNESS_EXPERIENCE;
  if (key === "beauty") return BEAUTY_EXPERIENCE;
  const v = businessVocabulary(vertical, category);
  return {
    ...DEFAULT_EXPERIENCE,
    partyCardTitle: `${v.clientNoun} & ${v.serviceNoun.toLowerCase()}`,
    clientFieldLabel: v.clientNoun,
    serviceFieldLabel: v.serviceNoun,
    listEmptyTitle: `No ${v.serviceNoun.toLowerCase()}s found`,
  };
}

/** Guest-facing hold copy while PENDING + awaiting_continuity (public confirm page). */
export function publicAwaitingContinuityHoldLines(
  vertical?: string | null,
  category?: string | null,
): string[] {
  const key = resolveVerticalKey(vertical, category);
  if (key === "wellness") {
    return [
      "Almost there — we've texted or emailed the number you provided.",
      "Reply with any health or arrival notes your studio asked for, or to confirm you're all set.",
      "Your session slot is held until the studio confirms (usually within a few hours).",
      "Add the session to your calendar below.",
    ];
  }
  return [
    "Almost there — we've sent a message to the phone or email you provided.",
    "Reply once with any photos or notes your team asked for, or to confirm you're all set.",
    "Your appointment is held until the salon confirms (usually within a few hours).",
    "Add the appointment to your calendar below.",
  ];
}

/** Guest-facing hold copy for other PENDING reasons (public confirm page). */
export function publicPendingReasonLine(
  pendingReason: string | null | undefined,
  businessName: string,
  vertical?: string | null,
  category?: string | null,
): string {
  const key = resolveVerticalKey(vertical, category);
  if (pendingReason === PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM) {
    return key === "wellness"
      ? `${businessName} will confirm your room and therapist shortly.`
      : `${businessName} will confirm your slot shortly.`;
  }
  if (pendingReason === PENDING_REASON_CODES.AWAITING_DEPOSIT) {
    return key === "wellness"
      ? "Complete the session deposit link we'll send to lock your room."
      : "Complete the deposit link we'll send to lock in your time.";
  }
  return key === "wellness"
    ? `${businessName} is reviewing your session request.`
    : `${businessName} is reviewing your booking.`;
}
