import type { BusinessVertical } from "./types";

export type VerticalPlaybook = {
  vertical: BusinessVertical;
  /** One-line wedge promise for marketing + onboarding */
  wedge: string;
  /** Hero workflow steps the product must support end-to-end */
  heroSteps: string[];
  /** Modules to surface on Home (ids match dashboard components) */
  homeModules: string[];
  /** Default public booking CTA copy */
  publicCta: string;
};

export const VERTICAL_PLAYBOOKS: Record<BusinessVertical, VerticalPlaybook> = {
  hair: {
    vertical: "hair",
    wedge: "Fill the chair — bookings, colour consults, and SMS continuity in one thread.",
    heroSteps: ["Public book", "SMS confirm + reference photo", "Deposit if policy requires", "Reminder T-24h"],
    homeModules: ["timeline", "proposals", "running-late"],
    publicCta: "Book your visit",
  },
  beauty: {
    vertical: "beauty",
    wedge: "DM-to-chair — lashes, nails, and brows without losing the thread.",
    heroSteps: ["Instagram/WhatsApp inbound", "Patch-test note on service", "Book + remind", "Rebook fill"],
    homeModules: ["timeline", "proposals", "inbox"],
    publicCta: "Book a treatment",
  },
  "body-art": {
    vertical: "body-art",
    wedge: "Consult → design proof → session deposit — long relationships, zero chaos.",
    heroSteps: ["Consult booking", "Design proof approval", "Session block", "Aftercare SMS"],
    homeModules: ["design-proofs", "proposals", "timeline"],
    publicCta: "Request a consult",
  },
  wellness: {
    vertical: "wellness",
    wedge: "Calm scheduling for massage and holistic — buffers and gift paths built in.",
    heroSteps: ["Public book", "Room buffer policy", "Reminder", "Package / voucher"],
    homeModules: ["timeline", "packages"],
    publicCta: "Book a session",
  },
  fitness: {
    vertical: "fitness",
    wedge: "Classes, PT packs, and waitlist — one roster for coaches.",
    heroSteps: ["Class capacity", "Waitlist offer on cancel", "Pack burn on book", "Staff borrow"],
    homeModules: ["classes", "timeline", "proposals"],
    publicCta: "Book a class",
  },
  medspa: {
    vertical: "medspa",
    wedge: "Consent-first aesthetics — procedure catalog, mandates, and clinical tone.",
    heroSteps: ["Procedure + consent on book", "Mandate-gated changes", "Waitlist for popular slots", "Audit trail"],
    homeModules: ["medspa-hub", "proposals", "timeline"],
    publicCta: "Book a consultation",
  },
  "allied-health": {
    vertical: "allied-health",
    wedge: "Lite clinic scheduling — assessments and follow-ups without pretending to be an EHR.",
    heroSteps: ["Assessment slot", "Follow-up chain", "Cancel window policy", "Continuity SMS"],
    homeModules: ["timeline", "proposals"],
    publicCta: "Book an appointment",
  },
  "pet-grooming": {
    vertical: "pet-grooming",
    wedge: "Pet profiles, temperament notes, and pickup timing — parents love SMS updates.",
    heroSteps: ["Pet on profile", "Groom duration by size", "Pickup SMS", "Rebook tidy"],
    homeModules: ["timeline", "inbox"],
    publicCta: "Book a groom",
  },
  "automotive-detailing": {
    vertical: "automotive-detailing",
    wedge: "Vehicle-aware packages — bay time and valet-style comms.",
    heroSteps: ["Package by vehicle size", "Bay booking", "Running late broadcast", "Upsell maintenance wash"],
    homeModules: ["timeline", "proposals"],
    publicCta: "Book your detail",
  },
  "event-vendors": {
    vertical: "event-vendors",
    wedge: "Enquiry → draft quote → send — IG leads without DM chaos.",
    heroSteps: ["Enquire form", "Draft from catalogue", "Send quote", "Track to booked"],
    homeModules: ["enquiries", "quotes", "timeline"],
    publicCta: "Get a quote",
  },
};

export function getVerticalPlaybook(vertical: BusinessVertical): VerticalPlaybook {
  return VERTICAL_PLAYBOOKS[vertical];
}

export function listVerticalPlaybooks() {
  return Object.values(VERTICAL_PLAYBOOKS);
}
