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
  if (args.depositRequired && (args.depositPaidEurCents ?? 0) <= 0) {
    return PENDING_REASON_CODES.AWAITING_DEPOSIT;
  }
  if (
    args.bookingContinuityEnabled !== false &&
    source === "web" &&
    (args.customerHasPhone || args.customerHasEmail)
  ) {
    return PENDING_REASON_CODES.AWAITING_CONTINUITY;
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

type VerticalPendingPack = {
  labels: Record<string, string>;
  guidance: Record<string, string>;
  /** Why Liv did not auto-confirm for awaiting_continuity — plain language, no internal jargon. */
  livContinuityBlocker: string;
  defaultPendingLabel: string;
  defaultGuidance: string;
};

const HAIR_PENDING_PACK: VerticalPendingPack = {
  labels: {
    [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
      "Stylist or front desk needs to confirm this appointment",
    [PENDING_REASON_CODES.AWAITING_DEPOSIT]: "Deposit due before confirming",
    [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]:
      "Review cancellation policy before confirming",
    [PENDING_REASON_CODES.CREATED_BY_LIV]: "Liv proposed this slot — confirm to hold the chair",
    [PENDING_REASON_CODES.OWNER_MANUAL]: "Walk-in or manual hold — confirm when the chair is ready",
    [PENDING_REASON_CODES.AWAITING_CONTINUITY]: "Waiting for client to confirm in messages",
  },
  guidance: {
    [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
      "Assign the stylist, then confirm — the client gets a confirmation once locked.",
    [PENDING_REASON_CODES.AWAITING_DEPOSIT]:
      "Send the deposit link or mark paid, then confirm the slot.",
    [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
      "They may need to reply with style notes or a quick yes — follow up in inbox or confirm when ready.",
    [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]:
      "Check your no-show and reschedule policy, then confirm.",
    [PENDING_REASON_CODES.CREATED_BY_LIV]:
      "Liv matched chair availability — confirm if service and duration look right.",
    [PENDING_REASON_CODES.OWNER_MANUAL]: "Confirm service, stylist, and time, then approve.",
  },
  livContinuityBlocker:
    "Liv won't auto-confirm until the client replies in their booking messages.",
  defaultPendingLabel: "Appointment pending — confirm to hold the chair",
  defaultGuidance:
    "Confirm, reschedule, or follow up when a deposit or chair rule needs you.",
};

const BODY_ART_PENDING_PACK: VerticalPendingPack = {
  labels: {
    [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
      "Artist or front desk needs to confirm this session",
    [PENDING_REASON_CODES.AWAITING_DEPOSIT]: "Deposit due before confirming",
    [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]:
      "Review studio policy before confirming",
    [PENDING_REASON_CODES.CREATED_BY_LIV]: "Liv proposed this slot — confirm to hold the session",
    [PENDING_REASON_CODES.OWNER_MANUAL]: "Manual hold — confirm when the station is ready",
    [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
      "Waiting for client reply (design reference or placement notes)",
  },
  guidance: {
    [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
      "Assign the artist, then confirm — the client gets a confirmation once locked.",
    [PENDING_REASON_CODES.AWAITING_DEPOSIT]:
      "Send the deposit link or mark paid, then confirm the session.",
    [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
      "Design reference or placement notes still outstanding — follow up or confirm when ready.",
    [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]:
      "Check consult and deposit policy, then confirm.",
    [PENDING_REASON_CODES.CREATED_BY_LIV]:
      "Liv matched studio availability — confirm if session length and artist look right.",
    [PENDING_REASON_CODES.OWNER_MANUAL]: "Confirm session, artist, and time, then approve.",
  },
  livContinuityBlocker:
    "Liv won't auto-confirm until the client replies with design details in messages.",
  defaultPendingLabel: "Session pending — confirm to hold the slot",
  defaultGuidance:
    "Confirm, reschedule, or follow up when a deposit or design step needs you.",
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

const WELLNESS_PENDING_PACK: VerticalPendingPack = {
  labels: WELLNESS_PENDING_LABELS,
  guidance: WELLNESS_PENDING_GUIDANCE,
  livContinuityBlocker:
    "Liv won't auto-confirm until the guest replies with intake or arrival notes in messages.",
  defaultPendingLabel: "Session pending — confirm to hold the room",
  defaultGuidance:
    "Confirm, reschedule, or follow up when a room hold or intake rule needs you.",
};

const FITNESS_PENDING_PACK: VerticalPendingPack = {
  labels: {
    [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
      "Coach or front desk needs to confirm this session",
    [PENDING_REASON_CODES.AWAITING_DEPOSIT]: "Session deposit due before confirming",
    [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]: "Review cancellation policy before confirming",
    [PENDING_REASON_CODES.CREATED_BY_LIV]: "Liv scheduled this session — confirm to hold the slot",
    [PENDING_REASON_CODES.OWNER_MANUAL]: "Manual hold — confirm when the slot is ready",
    [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
      "Waiting for member reply (session notes or confirmation)",
  },
  guidance: {
    [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
      "Assign the coach, then confirm — the member gets a confirmation once locked.",
    [PENDING_REASON_CODES.AWAITING_DEPOSIT]:
      "Collect the deposit, then confirm so the slot stays held.",
    [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
      "PAR-Q or session details still outstanding — follow up or confirm when ready.",
    [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]: "Check your cancel window, then confirm.",
    [PENDING_REASON_CODES.CREATED_BY_LIV]:
      "Liv matched coach availability — confirm if session type and length look right.",
    [PENDING_REASON_CODES.OWNER_MANUAL]: "Confirm session, coach, and time, then approve.",
  },
  livContinuityBlocker:
    "Liv won't auto-confirm until the member replies in their booking messages.",
  defaultPendingLabel: "Session pending — confirm to hold the slot",
  defaultGuidance: "Confirm, reschedule, or follow up when a session rule needs you.",
};

const CLINICAL_PENDING_PACK: VerticalPendingPack = {
  labels: {
    [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
      "Practitioner or reception needs to confirm this appointment",
    [PENDING_REASON_CODES.AWAITING_DEPOSIT]: "Deposit due before confirming",
    [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]: "Consent or policy review required",
    [PENDING_REASON_CODES.CREATED_BY_LIV]: "Liv proposed this slot — confirm to hold it",
    [PENDING_REASON_CODES.OWNER_MANUAL]: "Manual hold — confirm when ready",
    [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
      "Waiting for patient reply (intake or confirmation)",
  },
  guidance: {
    [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
      "Assign the practitioner, then confirm — the patient gets a confirmation once locked.",
    [PENDING_REASON_CODES.AWAITING_DEPOSIT]:
      "Collect the deposit, then confirm so the slot stays held.",
    [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
      "Pre-treatment intake or consent still outstanding — follow up or confirm when ready.",
    [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]:
      "Review consent and cancellation policy, then confirm.",
    [PENDING_REASON_CODES.CREATED_BY_LIV]:
      "Liv matched availability — confirm if treatment and practitioner look right.",
    [PENDING_REASON_CODES.OWNER_MANUAL]: "Confirm treatment, practitioner, and time, then approve.",
  },
  livContinuityBlocker:
    "Liv won't auto-confirm until the patient replies with intake details in messages.",
  defaultPendingLabel: "Appointment pending — confirm to hold the slot",
  defaultGuidance: "Confirm, reschedule, or follow up when intake or consent needs you.",
};

const PET_PENDING_PACK: VerticalPendingPack = {
  labels: {
    [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
      "Groomer or front desk needs to confirm this groom",
    [PENDING_REASON_CODES.AWAITING_DEPOSIT]: "Deposit due before confirming",
    [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]: "Review cancellation policy before confirming",
    [PENDING_REASON_CODES.CREATED_BY_LIV]: "Liv proposed this slot — confirm to hold it",
    [PENDING_REASON_CODES.OWNER_MANUAL]: "Manual hold — confirm when the slot is ready",
    [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
      "Waiting for pet parent reply (pet details or confirmation)",
  },
  guidance: {
    [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
      "Assign the groomer, then confirm — the pet parent gets a confirmation once locked.",
    [PENDING_REASON_CODES.AWAITING_DEPOSIT]:
      "Send the deposit link or mark paid, then confirm the groom.",
    [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
      "Pet details or temperament notes still outstanding — follow up or confirm when ready.",
    [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]: "Check your cancel window, then confirm.",
    [PENDING_REASON_CODES.CREATED_BY_LIV]:
      "Liv matched groomer availability — confirm if breed and service look right.",
    [PENDING_REASON_CODES.OWNER_MANUAL]: "Confirm groom, pet details, and time, then approve.",
  },
  livContinuityBlocker:
    "Liv won't auto-confirm until the pet parent replies with pet details in messages.",
  defaultPendingLabel: "Groom pending — confirm to hold the slot",
  defaultGuidance: "Confirm, reschedule, or follow up when pet details need you.",
};

const DETAILING_PENDING_PACK: VerticalPendingPack = {
  labels: {
    [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
      "Team needs to confirm this detail booking",
    [PENDING_REASON_CODES.AWAITING_DEPOSIT]: "Deposit due before confirming",
    [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]: "Review cancellation policy before confirming",
    [PENDING_REASON_CODES.CREATED_BY_LIV]: "Liv proposed this bay slot — confirm to hold it",
    [PENDING_REASON_CODES.OWNER_MANUAL]: "Manual hold — confirm when the bay is ready",
    [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
      "Waiting for client reply (vehicle details or confirmation)",
  },
  guidance: {
    [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
      "Assign the bay, then confirm — the client gets a confirmation once locked.",
    [PENDING_REASON_CODES.AWAITING_DEPOSIT]:
      "Collect the deposit, then confirm so the bay stays held.",
    [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
      "Vehicle make, model, or access notes still outstanding — follow up or confirm when ready.",
    [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]: "Check your cancel window, then confirm.",
    [PENDING_REASON_CODES.CREATED_BY_LIV]:
      "Liv matched bay availability — confirm if detail package and duration look right.",
    [PENDING_REASON_CODES.OWNER_MANUAL]: "Confirm detail, vehicle, and time, then approve.",
  },
  livContinuityBlocker:
    "Liv won't auto-confirm until the client replies with vehicle details in messages.",
  defaultPendingLabel: "Booking pending — confirm to hold the bay",
  defaultGuidance: "Confirm, reschedule, or follow up when vehicle details need you.",
};

const EVENT_PENDING_PACK: VerticalPendingPack = {
  labels: {
    [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]: "Team needs to confirm this event booking",
    [PENDING_REASON_CODES.AWAITING_DEPOSIT]: "Deposit due before confirming",
    [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]: "Review contract terms before confirming",
    [PENDING_REASON_CODES.CREATED_BY_LIV]: "Liv captured this enquiry — confirm to proceed",
    [PENDING_REASON_CODES.OWNER_MANUAL]: "Manual hold — confirm when ready",
    [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
      "Waiting for client reply (event details or confirmation)",
  },
  guidance: {
    [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
      "Review the brief, then confirm — the client gets a confirmation once locked.",
    [PENDING_REASON_CODES.AWAITING_DEPOSIT]:
      "Collect the deposit, then confirm so the date stays held.",
    [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
      "Event date, guest count, or theme still outstanding — follow up or confirm when ready.",
    [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]: "Check contract and cancel terms, then confirm.",
    [PENDING_REASON_CODES.CREATED_BY_LIV]:
      "Liv matched the enquiry — confirm if date and scope look right.",
    [PENDING_REASON_CODES.OWNER_MANUAL]: "Confirm event details, scope, and date, then approve.",
  },
  livContinuityBlocker:
    "Liv won't auto-confirm until the client replies with event details in messages.",
  defaultPendingLabel: "Enquiry pending — confirm to hold the date",
  defaultGuidance: "Confirm, quote, or follow up when event details need you.",
};

const BEAUTY_PENDING_LABELS: Record<string, string> = {
  [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
    "Artist or front desk needs to confirm this appointment",
  [PENDING_REASON_CODES.AWAITING_DEPOSIT]: "Deposit due before confirming",
  [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]: "Review cancellation policy before confirming",
  [PENDING_REASON_CODES.CREATED_BY_LIV]: "Liv proposed this slot — confirm to hold it",
  [PENDING_REASON_CODES.OWNER_MANUAL]: "Manual hold — confirm when the station is ready",
  [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
    "Waiting for client reply in messages",
};

const BEAUTY_PENDING_GUIDANCE: Record<string, string> = {
  [PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM]:
    "Assign the artist, then confirm — the client gets a confirmation once locked.",
  [PENDING_REASON_CODES.AWAITING_DEPOSIT]:
    "Send the deposit link or mark paid, then confirm the slot.",
  [PENDING_REASON_CODES.AWAITING_CONTINUITY]:
    "Client has not replied in messages yet — follow up or confirm when ready.",
  [PENDING_REASON_CODES.AWAITING_POLICY_REVIEW]:
    "Check fill vs full-set policy and cancel window, then confirm.",
  [PENDING_REASON_CODES.CREATED_BY_LIV]:
    "Liv matched availability from the enquiry — confirm if treatment and duration look right.",
  [PENDING_REASON_CODES.OWNER_MANUAL]:
    "Confirm treatment, artist, and time, then approve.",
};

const BEAUTY_PENDING_PACK: VerticalPendingPack = {
  labels: BEAUTY_PENDING_LABELS,
  guidance: BEAUTY_PENDING_GUIDANCE,
  livContinuityBlocker:
    "Liv won't auto-confirm until the client replies in their booking messages.",
  defaultPendingLabel: "Appointment pending — confirm to hold the slot",
  defaultGuidance:
    "Confirm, reschedule, or follow up when a deposit or intake rule needs you.",
};

const PENDING_PACKS: Record<BusinessVertical, VerticalPendingPack> = {
  hair: HAIR_PENDING_PACK,
  beauty: BEAUTY_PENDING_PACK,
  "body-art": BODY_ART_PENDING_PACK,
  wellness: WELLNESS_PENDING_PACK,
  fitness: FITNESS_PENDING_PACK,
  medspa: CLINICAL_PENDING_PACK,
  "allied-health": CLINICAL_PENDING_PACK,
  "pet-grooming": PET_PENDING_PACK,
  "automotive-detailing": DETAILING_PENDING_PACK,
  "event-vendors": EVENT_PENDING_PACK,
};

function pendingPack(vertical: BusinessVertical): VerticalPendingPack {
  return PENDING_PACKS[vertical];
}

/** Owner-facing label for API `pendingReason` — vertical-aware. */
export function pendingReasonLabel(
  reason: string | null | undefined,
  vertical?: string | null,
  category?: string | null,
): string {
  const key = resolveVerticalKey(vertical, category);
  const pack = pendingPack(key);
  if (reason && pack.labels[reason]) return pack.labels[reason];
  if (reason?.trim()) return reason.replace(/_/g, " ");
  return pack.defaultPendingLabel;
}

/** Mobile / approvals — what happened and what to do next. */
export function pendingApprovalGuidance(
  reason: string | null | undefined,
  vertical?: string | null,
  category?: string | null,
): string {
  const key = resolveVerticalKey(vertical, category);
  const pack = pendingPack(key);
  if (reason && pack.guidance[reason]) return pack.guidance[reason];
  return pack.defaultGuidance;
}

/** Why Liv did not auto-confirm — policy-driven, shown on owner surfaces. */
export function livPendingAutoConfirmBlocker(
  reason: string | null | undefined,
  vertical?: string | null,
  category?: string | null,
): string | null {
  if (!reason?.trim()) return null;
  const key = resolveVerticalKey(vertical, category);
  const pack = pendingPack(key);
  const slot =
    key === "wellness" || key === "fitness" || key === "body-art" ? "session" : "appointment";
  switch (reason) {
    case PENDING_REASON_CODES.AWAITING_DEPOSIT:
      return `Liv can't auto-confirm — your policy requires a deposit before this ${slot} locks.`;
    case PENDING_REASON_CODES.AWAITING_CONTINUITY:
      return pack.livContinuityBlocker;
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

/** Owner dashboard — stuck continuity card (24h+ no reply). */
export function stuckContinuityCardCopy(
  vertical?: string | null,
  category?: string | null,
): { title: string; description: string } {
  const key = resolveVerticalKey(vertical, category);
  const client = businessVocabulary(vertical, category).clientNoun.toLowerCase();
  const descriptions: Record<BusinessVertical, string> = {
    hair: `Online bookings where the ${client} has not replied in messages (24h+).`,
    beauty: `Appointments where the ${client} has not replied in messages (24h+).`,
    "body-art": `Sessions where the ${client} has not sent design details in messages (24h+).`,
    wellness: "Sessions where the guest has not replied to intake or arrival messages (24h+).",
    fitness: "Sessions where the member has not replied in messages (24h+).",
    medspa: "Appointments where the patient has not completed intake in messages (24h+).",
    "allied-health":
      "Appointments where the patient has not completed intake in messages (24h+).",
    "pet-grooming": "Grooms where the pet parent has not sent pet details in messages (24h+).",
    "automotive-detailing":
      "Bookings where the client has not sent vehicle details in messages (24h+).",
    "event-vendors": "Enquiries where the client has not sent event details in messages (24h+).",
  };
  return {
    title: "Bookings waiting on reply",
    description: descriptions[key],
  };
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
  detailPageSubtitle: "Status, messages, and next actions",
  backToListAria: "Back to bookings",
  partyCardTitle: "Client & service",
  clientFieldLabel: "Customer",
  serviceFieldLabel: "Service",
  mediaCardTitle: "Attachments",
  continuityPanelTitle: "Client messages",
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

const HAIR_EXPERIENCE: BookingExperienceCopy = {
  detailPageTitle: "Appointment detail",
  detailPageSubtitle: "Service, client notes, and confirm or reschedule",
  backToListAria: "Back to schedule",
  partyCardTitle: "Client & service",
  clientFieldLabel: "Client",
  serviceFieldLabel: "Service",
  mediaCardTitle: "Style references",
  continuityPanelTitle: "Client messages",
  continuityOpenThread: "Open thread",
  noGuestLabel: "No client on file",
  noServiceLabel: "No service selected",
  statusSectionTitle: "Status",
  notesDisclosureTitle: "Chair notes",
  notesDisclosureDescription: "Colour formula, allergies, preferences — internal only",
  listGuidedBookingTitle: "Guided booking",
  listGuidedBookingDescription: "Pick service, stylist, and time with Liv",
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

function experienceFromVocabulary(
  vertical: BusinessVertical,
  patch: Partial<BookingExperienceCopy>,
): BookingExperienceCopy {
  const v = businessVocabulary(vertical, null);
  const svc = v.serviceNoun.toLowerCase();
  const plural = svc.endsWith("s") ? svc : `${svc}s`;
  return {
    ...DEFAULT_EXPERIENCE,
    detailPageTitle: `${v.serviceNoun} detail`,
    detailPageSubtitle: `${v.serviceNoun}, ${v.clientNoun.toLowerCase()} notes, and confirm or reschedule`,
    backToListAria: "Back to schedule",
    partyCardTitle: `${v.clientNoun} & ${svc}`,
    clientFieldLabel: v.clientNoun,
    serviceFieldLabel: v.serviceNoun,
    noGuestLabel: `No ${v.clientNoun.toLowerCase()} on file`,
    noServiceLabel: `No ${svc} selected`,
    listEmptyTitle: `No ${plural} in this view`,
    listEmptyPendingCta: `New ${svc}`,
    toastStatusUpdated: (status) => `${v.serviceNoun} ${status.toLowerCase()}`,
    ...patch,
  };
}

const BODY_ART_EXPERIENCE = experienceFromVocabulary("body-art", {
  detailPageTitle: "Session detail",
  mediaCardTitle: "Design references",
  notesDisclosureTitle: "Studio notes",
  notesDisclosureDescription: "Placement, sizing, and consent — internal only",
  listGuidedBookingDescription: "Pick session, artist, and time with Liv",
  listQuickAddLabel: "Quick book",
  listEmptyPendingCta: "New session",
  statusActions: {
    CONFIRMED: "Confirm session",
    COMPLETED: "Session complete",
    CANCELLED: "Cancel",
    NO_SHOW: "No-show",
  },
});

const FITNESS_EXPERIENCE = experienceFromVocabulary("fitness", {
  detailPageTitle: "Session detail",
  clientFieldLabel: "Member",
  partyCardTitle: "Member & session",
  notesDisclosureDescription: "Goals and health notes — internal only",
  listGuidedBookingDescription: "Pick session, coach, and time with Liv",
  statusActions: {
    CONFIRMED: "Confirm session",
    COMPLETED: "Session complete",
    CANCELLED: "Cancel",
    NO_SHOW: "No-show",
  },
});

const MEDSPA_EXPERIENCE = experienceFromVocabulary("medspa", {
  detailPageTitle: "Appointment detail",
  clientFieldLabel: "Patient",
  partyCardTitle: "Patient & treatment",
  serviceFieldLabel: "Treatment",
  mediaCardTitle: "Intake attachments",
  notesDisclosureDescription: "Consent and clinical notes — internal only",
  listGuidedBookingDescription: "Pick treatment, practitioner, and time with Liv",
});

const ALLIED_HEALTH_EXPERIENCE = experienceFromVocabulary("allied-health", {
  detailPageTitle: "Appointment detail",
  clientFieldLabel: "Patient",
  partyCardTitle: "Patient & appointment",
  serviceFieldLabel: "Appointment",
  mediaCardTitle: "Referral attachments",
  notesDisclosureDescription: "Clinical notes — internal only",
  listGuidedBookingDescription: "Pick appointment, clinician, and time with Liv",
});

const PET_EXPERIENCE = experienceFromVocabulary("pet-grooming", {
  detailPageTitle: "Groom detail",
  clientFieldLabel: "Pet parent",
  partyCardTitle: "Pet parent & groom",
  serviceFieldLabel: "Groom",
  mediaCardTitle: "Pet photos",
  notesDisclosureDescription: "Breed, temperament, and handling — internal only",
  listGuidedBookingDescription: "Pick groom, groomer, and time with Liv",
  listEmptyPendingCta: "New groom",
});

const DETAILING_EXPERIENCE = experienceFromVocabulary("automotive-detailing", {
  detailPageTitle: "Booking detail",
  mediaCardTitle: "Vehicle photos",
  notesDisclosureDescription: "Make, model, and paint notes — internal only",
  listGuidedBookingDescription: "Pick detail package, bay, and time with Liv",
  listEmptyPendingCta: "New booking",
});

const EVENT_EXPERIENCE = experienceFromVocabulary("event-vendors", {
  detailPageTitle: "Event detail",
  partyCardTitle: "Client & service",
  notesDisclosureDescription: "Theme, guest count, and setup — internal only",
  listGuidedBookingDescription: "Capture event details and quote with Liv",
  listEmptyPendingCta: "New enquiry",
  statusActions: {
    CONFIRMED: "Confirm event",
    COMPLETED: "Event complete",
    CANCELLED: "Cancel",
    NO_SHOW: "No-show",
  },
});

const BOOKING_EXPERIENCE_BY_VERTICAL: Record<BusinessVertical, BookingExperienceCopy> = {
  hair: HAIR_EXPERIENCE,
  beauty: BEAUTY_EXPERIENCE,
  wellness: WELLNESS_EXPERIENCE,
  "body-art": BODY_ART_EXPERIENCE,
  fitness: FITNESS_EXPERIENCE,
  medspa: MEDSPA_EXPERIENCE,
  "allied-health": ALLIED_HEALTH_EXPERIENCE,
  "pet-grooming": PET_EXPERIENCE,
  "automotive-detailing": DETAILING_EXPERIENCE,
  "event-vendors": EVENT_EXPERIENCE,
};

/** W4 booking list + detail + continuity — operator copy. */
export function bookingExperienceCopy(
  vertical?: string | null,
  category?: string | null,
): BookingExperienceCopy {
  const key = resolveVerticalKey(vertical, category);
  return BOOKING_EXPERIENCE_BY_VERTICAL[key];
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
  if (key === "hair") {
    return [
      "Almost there — we've sent a message to the phone or email you provided.",
      "Reply with style notes or a quick confirmation when you're ready.",
      "Your appointment is held until the shop confirms (usually within a few hours).",
      "Add the appointment to your calendar below.",
    ];
  }
  if (key === "beauty") {
    return [
      "Almost there — we've sent a message to the phone or email you provided.",
      "Reply with style notes or a quick confirmation when you're ready.",
      "Your appointment is held until the studio confirms (usually within a few hours).",
      "Add the appointment to your calendar below.",
    ];
  }
  if (key === "body-art") {
    return [
      "Almost there — we've sent a message to the phone or email you provided.",
      "Reply with design references or placement notes if your artist asked for them.",
      "Your session slot is held until the studio confirms (usually within a few hours).",
      "Add the session to your calendar below.",
    ];
  }
  const v = businessVocabulary(vertical, category);
  return [
    "Almost there — we've sent a message to the phone or email you provided.",
    `Reply with any details your ${v.teamNoun.toLowerCase()} asked for, or to confirm you're all set.`,
    `Your ${v.serviceNoun.toLowerCase()} is held until ${v.locationNoun.toLowerCase()} confirms (usually within a few hours).`,
    `Add the ${v.serviceNoun.toLowerCase()} to your calendar below.`,
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
