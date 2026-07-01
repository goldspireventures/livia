import type { BusinessVertical } from "./types";

export type ContinuityMode = "sms_thread" | "whatsapp_thread" | "email_only" | "instagram_deep_link";

export interface ContinuityTemplate {
  smsBody: (args: ContinuityMessageArgs) => string;
  emailSubject: (args: ContinuityMessageArgs) => string;
  emailBody: (args: ContinuityMessageArgs) => string;
  publicNextSteps: (args: ContinuityMessageArgs) => string[];
  igDeepLinkHint?: (args: ContinuityMessageArgs) => string | undefined;
}

export interface ContinuityMessageArgs {
  businessName: string;
  serviceName: string;
  staffDisplayName: string | null;
  startAtLocal: string;
  bookingRef: string;
  instagramHandle?: string | null;
  /** Link-first guest surface (G3) — thick Livia page for replies & day-of. */
  visitUrl?: string | null;
  /** When PENDING, smsBody uses request/hold copy — never "You're booked". */
  bookingStatus?: string | null;
  pendingReason?: string | null;
}

function isPendingBooking(args: ContinuityMessageArgs): boolean {
  return (args.bookingStatus ?? "CONFIRMED").toUpperCase() === "PENDING";
}

function slotLine(args: ContinuityMessageArgs): string {
  return `${args.serviceName} at ${args.businessName} on ${args.startAtLocal}${
    args.staffDisplayName ? ` with ${args.staffDisplayName}` : ""
  }. Ref ${args.bookingRef}.`;
}

function continuityLead(
  args: ContinuityMessageArgs,
  confirmedLead: string,
  pendingLead: string,
): string {
  return isPendingBooking(args) ? pendingLead : confirmedLead;
}

function visitLinkSuffix(args: ContinuityMessageArgs): string {
  if (!args.visitUrl) return "";
  return ` Manage your visit: ${args.visitUrl}`;
}

const BASE_SMS = (args: ContinuityMessageArgs, extra: string, pendingExtra?: string) => {
  const lead = continuityLead(
    args,
    `You're booked for ${slotLine(args)}`,
    `We've requested ${slotLine(args)}`,
  );
  const tail = isPendingBooking(args) ? (pendingExtra ?? extra) : extra;
  return `${lead} ${tail}${visitLinkSuffix(args)}`;
};

const HAIR: ContinuityTemplate = {
  smsBody: (a) =>
    BASE_SMS(
      a,
      "Reply here with inspiration photos or questions — we'll confirm in this thread.",
    ),
  emailSubject: (a) => `Your appointment at ${a.businessName}`,
  emailBody: (a) =>
    `${BASE_SMS(a, "Reply to this email with style references or questions.")}`,
  publicNextSteps: (a) => [
    a.visitUrl
      ? `We'll text or email you at the number you gave — reply there with inspiration photos or questions (ref ${a.bookingRef}).`
      : `Watch for a message from ${a.businessName} — reply with inspiration photos or questions (ref ${a.bookingRef}).`,
    a.instagramHandle
      ? `Prefer Instagram? Message @${a.instagramHandle.replace(/^@/, "")} with ref ${a.bookingRef}.`
      : "Keep replies in that same conversation so your team has everything in one place.",
    "Add the appointment to your calendar below.",
  ],
  igDeepLinkHint: (a) =>
    a.instagramHandle
      ? `Message @${a.instagramHandle.replace(/^@/, "")} with booking ref ${a.bookingRef}`
      : undefined,
};

const PET: ContinuityTemplate = {
  smsBody: (a) =>
    BASE_SMS(
      a,
      "Reply with your pet's name, breed, and any behaviour or allergy notes — photos welcome.",
    ),
  emailSubject: (a) => `Grooming appointment — ${a.businessName}`,
  emailBody: (a) =>
    `${BASE_SMS(a, "Reply with pet details and temperament notes so we prep the right setup.")}`,
  publicNextSteps: (a) => [
    "We'll text you to confirm pet details and any special handling.",
    "Vaccination records can be sent in the same thread if your groomer requires them.",
    `Reference: ${a.bookingRef}`,
  ],
};

const WELLNESS: ContinuityTemplate = {
  smsBody: (a) =>
    BASE_SMS(
      a,
      "Reply if you have health questions, accessibility needs, or to confirm your arrival time.",
    ),
  emailSubject: (a) => `Your session at ${a.businessName}`,
  emailBody: (a) =>
    `${BASE_SMS(a, "We'll confirm your room slot once any intake questions are answered.")}`,
  publicNextSteps: (a) => [
    a.visitUrl
      ? `Watch for a message from ${a.businessName} — reply with health or arrival notes (ref ${a.bookingRef}).`
      : `Watch for a message from ${a.businessName} — reply with any intake or arrival questions (ref ${a.bookingRef}).`,
    a.visitUrl ? `Visit prep: ${a.visitUrl}` : "Your studio may ask light intake questions before confirming the room.",
    "Add the session to your calendar below.",
  ],
};

const MEDSPA_CALM: ContinuityTemplate = {
  smsBody: (a) =>
    BASE_SMS(
      a,
      "Reply only if you have pre-treatment questions.",
      "The clinic will confirm shortly — reply with any health notes if needed.",
    ),
  emailSubject: (a) => `Treatment booking — ${a.businessName}`,
  emailBody: (a) => MEDSPA_CALM.smsBody(a),
  publicNextSteps: (a) =>
    isPendingBooking(a)
      ? [
          "Your clinic will confirm your appointment shortly.",
          "Check your messages for any intake or consent questions.",
        ]
      : [
          "Your appointment is confirmed — reply if you have pre-treatment questions.",
          "Check your messages for any forms if the clinic sent them.",
        ],
};

const ALLIED_HEALTH: ContinuityTemplate = {
  smsBody: (a) =>
    BASE_SMS(
      a,
      "Reply if you have questions before your visit.",
      "The practice will confirm your appointment shortly — reply with any health notes if needed.",
    ),
  emailSubject: (a) => `Appointment — ${a.businessName}`,
  emailBody: (a) => ALLIED_HEALTH.smsBody(a),
  publicNextSteps: (a) =>
    isPendingBooking(a)
      ? [
          `${a.businessName} will confirm your appointment shortly.`,
          "Reply in this thread with any health notes or accessibility needs.",
        ]
      : [
          "Your appointment is confirmed.",
          "Reply if you have questions before you visit.",
        ],
};

const BEAUTY: ContinuityTemplate = {
  smsBody: (a) =>
    BASE_SMS(
      a,
      "Reply with treatment questions, allergies, or style notes — we'll confirm in this thread.",
    ),
  emailSubject: (a) => `Your appointment at ${a.businessName}`,
  emailBody: (a) =>
    `${BASE_SMS(a, "Reply with allergies, inspiration photos, or questions for your artist.")}`,
  publicNextSteps: (a) => [
    a.visitUrl
      ? `Watch for a message from ${a.businessName} — reply in the same thread (ref ${a.bookingRef}).`
      : `Watch for a message from ${a.businessName} — reply in the same thread (ref ${a.bookingRef}).`,
    "Add the appointment to your calendar below.",
  ],
  igDeepLinkHint: (a) =>
    a.instagramHandle
      ? `Message @${a.instagramHandle.replace(/^@/, "")} with booking ref ${a.bookingRef}`
      : undefined,
};

const DEFAULT = HAIR;

export const CONTINUITY_TEMPLATES: Record<BusinessVertical, ContinuityTemplate> = {
  hair: HAIR,
  beauty: BEAUTY,
  "body-art": {
    ...HAIR,
    smsBody: (a) =>
      BASE_SMS(
        a,
        "Reply with reference images or design notes — deposit and proof steps may follow.",
      ),
    publicNextSteps: (a) => [
      "We'll message you for reference images or design approval if needed.",
      `Booking ref ${a.bookingRef}`,
    ],
  },
  wellness: WELLNESS,
  fitness: {
    smsBody: (a) =>
      BASE_SMS(a, "Reply if you need to change session type or share health updates."),
    emailSubject: (a) => `Your session at ${a.businessName}`,
    emailBody: (a) =>
      `${BASE_SMS(a, "Reply with session questions or health updates for your coach.")}`,
    publicNextSteps: (a) => [
      `Watch for a message from ${a.businessName} — reply with session notes (ref ${a.bookingRef}).`,
      "Your coach may confirm session details by message.",
      "Add the session to your calendar below.",
    ],
  },
  medspa: MEDSPA_CALM,
  "allied-health": ALLIED_HEALTH,
  "pet-grooming": PET,
  "automotive-detailing": {
    smsBody: (a) =>
      BASE_SMS(
        a,
        "Reply with vehicle make/model and any paint protection or add-ons you want quoted.",
      ),
    emailSubject: (a) => `Detailing booking — ${a.businessName}`,
    emailBody: (a) =>
      `${BASE_SMS(a, "Include vehicle details and access notes in your reply.")}`,
    publicNextSteps: () => [
      "We'll confirm vehicle details and bay access by text.",
      "Send photos of condition or registration area if requested.",
    ],
  },
  "event-vendors": {
    smsBody: (a) =>
      BASE_SMS(a, "Reply with your event date, guest count, and theme — or use our enquire link."),
    emailSubject: (a) => `Your event enquiry — ${a.businessName}`,
    emailBody: (a) =>
      `${BASE_SMS(a, "We'll send a quote once we have your event details.")}`,
    publicNextSteps: () => [
      "We'll review your enquiry and send a quote within 24 hours.",
      "Check your email or WhatsApp for our reply.",
    ],
  },
};

const DE_HAIR: ContinuityTemplate = {
  smsBody: (a) =>
    `Termin: ${a.serviceName} bei ${a.businessName} am ${a.startAtLocal}${
      a.staffDisplayName ? ` mit ${a.staffDisplayName}` : ""
    }. Ref ${a.bookingRef}. Antworten Sie hier mit Fotos oder Fragen — wir bestätigen in diesem Thread.`,
  emailSubject: (a) => `Ihr Termin bei ${a.businessName}`,
  emailBody: (a) => DE_HAIR.smsBody(a),
  publicNextSteps: (a) => [
    `Prüfen Sie Ihre Nachrichten von ${a.businessName} — antworten Sie dort mit Fotos oder Fragen (Ref ${a.bookingRef}).`,
    a.instagramHandle
      ? `Optional Instagram: @${a.instagramHandle.replace(/^@/, "")} mit Ref ${a.bookingRef}.`
      : "Bitte in diesem Thread antworten, damit Ihr Team alles an einem Ort sieht.",
    "Termin unten in den Kalender übernehmen.",
  ],
  igDeepLinkHint: HAIR.igDeepLinkHint,
};

export function getContinuityTemplate(
  vertical: BusinessVertical,
  locale?: string | null,
): ContinuityTemplate {
  const base = CONTINUITY_TEMPLATES[vertical] ?? DEFAULT;
  if (locale?.toLowerCase().startsWith("de")) {
    if (vertical === "medspa" || vertical === "allied-health") {
      return {
        ...(vertical === "allied-health" ? ALLIED_HEALTH : MEDSPA_CALM),
        smsBody: (a) =>
          isPendingBooking(a)
            ? `Termin angefragt: ${a.serviceName} bei ${a.businessName} am ${a.startAtLocal}. Ref ${a.bookingRef}. Die Praxis bestätigt in Kürze.`
            : `Termin: ${a.serviceName} bei ${a.businessName} am ${a.startAtLocal}. Ref ${a.bookingRef}. Bei Fragen vor dem Termin antworten Sie bitte hier.`,
        publicNextSteps: () => [
          "Ihre Praxis kann Sie zu Aufnahme oder Einwilligung kontaktieren.",
          "Prüfen Sie Ihre Nachrichten auf erforderliche Antworten.",
        ],
      };
    }
    if (vertical === "pet-grooming") return { ...PET, smsBody: DE_HAIR.smsBody, publicNextSteps: DE_HAIR.publicNextSteps };
    return DE_HAIR;
  }
  return base;
}
