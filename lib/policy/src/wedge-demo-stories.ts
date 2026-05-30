import type { BusinessVertical } from "./types";
import { VERTICAL_COVERAGE_REGISTRY } from "./vertical-coverage";

export type WedgeDemoBeat = {
  /** One sentence + UI hint (inbox row, /b hero, SMS mock, Today card). */
  headline: string;
  /** Short subline for interstitial card. */
  detail: string;
  /** Visual hint for design/dev galleries — not user-facing. */
  cropHint: "inbox" | "public-book" | "sms" | "today" | "proof" | "consent";
};

export type WedgeDemoStory = {
  vertical: BusinessVertical;
  label: string;
  demoSlug: string | null;
  tier: string;
  beats: WedgeDemoBeat[];
};

const WEDGE_BEATS: Record<BusinessVertical, WedgeDemoBeat[]> = {
  "body-art": [
    { headline: "Consult lands in your Inbox", detail: "Every DM becomes a thread Liv can act on.", cropHint: "inbox" },
    { headline: "Design proof — one link", detail: "Guest approves on their phone. No WhatsApp photo tennis.", cropHint: "proof" },
    { headline: "Deposit holds the session", detail: "Serious bookings only. Policy you set.", cropHint: "public-book" },
    { headline: "Today — who's in the chair", detail: "Artists see the day, not a spreadsheet.", cropHint: "today" },
  ],
  hair: [
    { headline: "Instagram DM → Inbox", detail: "Liv catches the inquiry before you put down the scissors.", cropHint: "inbox" },
    { headline: "Client books from your link", detail: "Professional `/b` page — your brand, not a generic widget.", cropHint: "public-book" },
    { headline: "Reminder before the visit", detail: "SMS with one tap — no account needed.", cropHint: "sms" },
    { headline: "Today — who's next", detail: "The whole shop on one calm screen.", cropHint: "today" },
  ],
  beauty: [
    { headline: "Inquiry in Inbox", detail: "Patch tests, lash styles — context stays with the thread.", cropHint: "inbox" },
    { headline: "Book + intake note", detail: "Vertical-smart booking guards on `/b`.", cropHint: "public-book" },
    { headline: "Reminder SMS", detail: "Fewer no-shows. Link-first continuity.", cropHint: "sms" },
    { headline: "Today — stations clear", detail: "Who's in, who's next, who needs you.", cropHint: "today" },
  ],
  medspa: [
    { headline: "Consult request captured", detail: "Liv triages before clinical time is spent.", cropHint: "inbox" },
    { headline: "Consent on book", detail: "Guest signs on `/b` — audit trail for you.", cropHint: "consent" },
    { headline: "Reminder + prep note", detail: "Honest EU disclosure every time.", cropHint: "sms" },
    { headline: "Today — treatment flow", detail: "Sessions, consent status, one glance.", cropHint: "today" },
  ],
  wellness: [
    { headline: "Guest message → Inbox", detail: "Calm tone, gift vouchers, multi-service requests.", cropHint: "inbox" },
    { headline: "Book a treatment", detail: "Spa-appropriate `/b` — not a salon form.", cropHint: "public-book" },
    { headline: "Gentle reminder", detail: "SMS link back to their visit token.", cropHint: "sms" },
    { headline: "Today — rooms & therapists", detail: "Floor calm, not chaos.", cropHint: "today" },
  ],
  fitness: [
    { headline: "Class inquiry", detail: "Waitlist and packages in one thread.", cropHint: "inbox" },
    { headline: "Book or join waitlist", detail: "Capacity-aware `/b` flow.", cropHint: "public-book" },
    { headline: "Reminder before class", detail: "One link — reschedule without login.", cropHint: "sms" },
    { headline: "Today — floor & PT", detail: "Who's checked in, who's due.", cropHint: "today" },
  ],
  "allied-health": [
    { headline: "Intake message", detail: "Lite clinic flow — not an EHR.", cropHint: "inbox" },
    { headline: "Book appointment", detail: "Prep notes and jurisdiction copy on `/b`.", cropHint: "public-book" },
    { headline: "Reminder + prep", detail: "What to bring — in the SMS.", cropHint: "sms" },
    { headline: "Today — practitioners", detail: "Day list with context, not codes.", cropHint: "today" },
  ],
  "pet-grooming": [
    { headline: "Pet parent inquiry", detail: "Breed, behaviour — Liv keeps context.", cropHint: "inbox" },
    { headline: "Book + pet profile", detail: "Parent books; pet record follows.", cropHint: "public-book" },
    { headline: "Reminder SMS", detail: "Day-of link to visit page.", cropHint: "sms" },
    { headline: "Today — who's on the table", detail: "Groomers see pets, not just names.", cropHint: "today" },
  ],
  "automotive-detailing": [
    { headline: "Vehicle / slot inquiry", detail: "Valeting requests land in Inbox.", cropHint: "inbox" },
    { headline: "Book detail session", detail: "Slot + service on `/b`.", cropHint: "public-book" },
    { headline: "Reminder", detail: "Customer confirms from SMS.", cropHint: "sms" },
    { headline: "Today — bay schedule", detail: "What's in, what's next.", cropHint: "today" },
  ],
};

/** Registry verticals shippable in demo grid (tier ≠ defer). */
export function listWedgeDemoVerticals(): BusinessVertical[] {
  const seen = new Set<BusinessVertical>();
  for (const row of VERTICAL_COVERAGE_REGISTRY) {
    if (row.tier === "defer" || !row.codeVertical) continue;
    seen.add(row.codeVertical);
  }
  return [...seen];
}

export function getWedgeDemoStory(vertical: BusinessVertical): WedgeDemoStory | null {
  const row = VERTICAL_COVERAGE_REGISTRY.find((e) => e.codeVertical === vertical);
  if (!row || row.tier === "defer") return null;
  const beats = WEDGE_BEATS[vertical];
  if (!beats?.length) return null;
  return {
    vertical,
    label: row.label,
    demoSlug: row.demoSlug,
    tier: row.tier,
    beats,
  };
}

export function resolveWedgeDemoStory(
  vertical: string | null | undefined,
): WedgeDemoStory | null {
  if (!vertical) return null;
  const v = vertical.toLowerCase() as BusinessVertical;
  return getWedgeDemoStory(v);
}
