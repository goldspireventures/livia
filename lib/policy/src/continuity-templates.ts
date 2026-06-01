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
}

function visitLinkSuffix(args: ContinuityMessageArgs): string {
  if (!args.visitUrl) return "";
  return ` Manage your visit: ${args.visitUrl}`;
}

const BASE_SMS = (args: ContinuityMessageArgs, extra: string) =>
  `You're booked for ${args.serviceName} at ${args.businessName} on ${args.startAtLocal}${
    args.staffDisplayName ? ` with ${args.staffDisplayName}` : ""
  }. Ref ${args.bookingRef}. ${extra}${visitLinkSuffix(args)}`;

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

const MEDSPA_CALM: ContinuityTemplate = {
  smsBody: (a) =>
    BASE_SMS(
      a,
      "Reply only if you have pre-treatment questions — we'll confirm once intake is complete.",
    ),
  emailSubject: (a) => `Treatment booking — ${a.businessName}`,
  emailBody: (a) => `${BASE_SMS(a, "Our team will follow up if intake or consent is required.")}`,
  publicNextSteps: () => [
    "Your clinic may contact you for intake or consent before the appointment is fully confirmed.",
    "Check your messages for any forms or replies needed.",
  ],
};

const DEFAULT = HAIR;

export const CONTINUITY_TEMPLATES: Record<BusinessVertical, ContinuityTemplate> = {
  hair: HAIR,
  beauty: HAIR,
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
  wellness: {
    ...HAIR,
    smsBody: (a) => BASE_SMS(a, "Reply if you have health questions before your session."),
    publicNextSteps: () => ["Check your messages for any intake questions from the studio."],
  },
  fitness: {
    ...HAIR,
    smsBody: (a) => BASE_SMS(a, "Reply if you need to change session type or share PAR-Q updates."),
    publicNextSteps: () => ["Your studio may confirm session details by message."],
  },
  medspa: MEDSPA_CALM,
  "allied-health": MEDSPA_CALM,
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
        ...MEDSPA_CALM,
        smsBody: (a) =>
          `Termin: ${a.serviceName} bei ${a.businessName} am ${a.startAtLocal}. Ref ${a.bookingRef}. Bei Fragen vor der Behandlung antworten Sie bitte hier.`,
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
