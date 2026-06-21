import type { BusinessVertical } from "./types";
import type { WedgeDemoBeat } from "./wedge-demo-stories";

export type WedgeVerticalPack = {
  vertical: BusinessVertical;
  /** Demo tenant used for G2 screenshots (registry default). */
  demoSlug: string;
  /** Human label for alt text — matches seeded business name. */
  businessLabel: string;
  /** Short story arc under the G1 title. */
  arc: string;
  /** Liv briefing block at top of thread. */
  livIntro: string;
  /** Bridge copy between chapters (Liv voice). */
  bridges: Partial<Record<WedgeDemoBeat["cropHint"], string>>;
  /**
   * Public asset folder under `/w2-gateway/beats/` (inbox.png, book-mobile.png, today.png).
   * When omitted, beauty uses `/w2-gateway/platform-default/` and event-vendors use atelier pack.
   */
  assetFolder?: string;
};

const PRODUCT_THREAD_PACKS: WedgeVerticalPack[] = [
  {
    vertical: "hair",
    demoSlug: "luxe-salon-spa",
    businessLabel: "Luxe Salon & Spa",
    arc: "From DM to chair",
    livIntro:
      "Three surfaces, one thread — bookings, your booking link, and Today at Luxe Salon & Spa.",
    assetFolder: "hair/luxe-salon",
    bridges: {
      inbox: "Instagram DMs and walk-ins land in one list — confirm or guide without leaving Bookings.",
      "public-book": "Same guest, same brand. They pick a stylist and slot from your link — no account.",
      today: "You open Today — the chair plan, revenue, and what Liv already handled.",
    },
  },
  {
    vertical: "beauty",
    demoSlug: "bloom-beauty-dublin",
    businessLabel: "Bloom Beauty · Dublin",
    arc: "From DM to chair",
    livIntro:
      "Three surfaces, one thread — bookings, your booking link, and Today at Bloom Beauty Dublin.",
    bridges: {
      inbox: "Pending visits line up — confirm or guide without leaving the list.",
      "public-book": "Same guest, same brand. They book from your link without an account.",
      today: "You open Today — the chair plan, revenue, and what Liv already handled.",
    },
  },
  {
    vertical: "wellness",
    demoSlug: "harbour-wellness-cork",
    businessLabel: "Harbour Wellness · Cork",
    arc: "From message to room",
    livIntro:
      "Three surfaces, one thread — concierge, your booking link, and the room board at Harbour Wellness Cork.",
    assetFolder: "wellness/harbour-light",
    bridges: {
      inbox: "Gift vouchers and calm SMS land in concierge — Liv holds the room fit.",
      "public-book": "Guests pick treatments on a spa-native booking page — gift-ready, not salon chrome.",
      today: "Room swimlanes show turnover, vouchers, and who's in Serenity next.",
    },
  },
  {
    vertical: "body-art",
    demoSlug: "ink-anchor-galway",
    businessLabel: "Ink Anchor · Galway",
    arc: "From consult to chair",
    livIntro:
      "Three surfaces, one thread — consult inbox, your booking link, and Today at Ink Anchor Galway.",
    assetFolder: "body-art/ink-anchor",
    bridges: {
      inbox: "Every DM becomes a thread — deposit policy and artist context stay attached.",
      "public-book": "Guests book consults and sessions from your link — deposit holds the slot.",
      today: "Artists see the day, proof status, and who's in the chair — not a spreadsheet.",
    },
  },
  {
    vertical: "medspa",
    demoSlug: "clarity-medspa-dublin",
    businessLabel: "Clarity Medspa · Dublin",
    arc: "From consult to treatment",
    livIntro:
      "Three surfaces, one thread — consult triage, consent at booking, and Today at Clarity Medspa Dublin.",
    assetFolder: "medspa/clarity",
    bridges: {
      inbox: "Consult requests triage before clinical time — Liv captures intent and prep notes.",
      "public-book": "Guest signs consent when they book online — audit trail before they arrive.",
      today: "Treatment flow, consent status, and session prep — one calm glance.",
    },
  },
  {
    vertical: "fitness",
    demoSlug: "peak-fitness-dublin",
    businessLabel: "Peak Fitness · Dublin",
    arc: "From inquiry to check-in",
    livIntro:
      "Three surfaces, one thread — class inquiries, capacity-aware booking, and Today at Peak Fitness Dublin.",
    assetFolder: "fitness/peak",
    bridges: {
      inbox: "Waitlist and package questions land in one thread — Liv keeps class context.",
      "public-book": "Guests book classes or join the waitlist from your link — capacity respected.",
      today: "Floor and PT schedule — who's checked in, who's due next.",
    },
  },
  {
    vertical: "allied-health",
    demoSlug: "motion-physio-cork",
    businessLabel: "Motion Physio · Cork",
    arc: "From intake to session",
    livIntro:
      "Three surfaces, one thread — intake messages, prep-aware booking, and Today at Motion Physio Cork.",
    assetFolder: "allied-health/motion",
    bridges: {
      inbox: "Intake messages arrive with context — lite clinic flow, not an EHR.",
      "public-book": "Patients book with prep notes and jurisdiction copy on your booking page.",
      today: "Practitioner day list with visit context — not diagnosis codes.",
    },
  },
  {
    vertical: "pet-grooming",
    demoSlug: "paws-parlour-dublin",
    businessLabel: "Paws Parlour · Dublin",
    arc: "From inquiry to groom table",
    livIntro:
      "Three surfaces, one thread — pet parent inquiries, profile-aware booking, and Today at Paws Parlour Dublin.",
    assetFolder: "pet-grooming/paws",
    bridges: {
      inbox: "Breed and behaviour notes stay on the thread — Liv keeps pet context.",
      "public-book": "Parents book and attach pet profiles from your link.",
      today: "Groomers see pets on the table — not just owner names.",
    },
  },
  {
    vertical: "automotive-detailing",
    demoSlug: "shine-studio-belfast",
    businessLabel: "Shine Studio · Belfast",
    arc: "From inquiry to bay",
    livIntro:
      "Three surfaces, one thread — valeting requests, online slot booking, and Today at Shine Studio Belfast.",
    assetFolder: "automotive-detailing/shine",
    bridges: {
      inbox: "Vehicle and slot inquiries land in Inbox — Liv captures make and service.",
      "public-book": "Customers pick detail packages and bay slots from your link.",
      today: "Bay schedule — what's in, what's next, who's due a handover.",
    },
  },
];

const EVENT_VENDOR_PACK: WedgeVerticalPack = {
  vertical: "event-vendors",
  demoSlug: "atelier-decor-dublin",
  businessLabel: "Atelier Decor · Dublin",
  arc: "From enquiry to celebration",
  livIntro:
    "The three things no decor studio has in one place — every lead, quotes that write themselves, and a catalogue that thinks in events.",
  assetFolder: "event-vendors/atelier",
  bridges: {
    inbox: "Sarah's birthday enquiry lands from WhatsApp — review and reply in inbox.",
    "quote-gen": "One tap: birthday template + guest count → line items, deposit %, PDF-ready quote.",
    catalogue: "Per-table centrepieces and per-guest sashes — quantities scale from the enquiry brief.",
    "milestone-pay": "Guest accepts on their phone — deposit secures the date; balance milestones collect automatically.",
  },
};

const PACK_BY_VERTICAL = new Map<BusinessVertical, WedgeVerticalPack>(
  [...PRODUCT_THREAD_PACKS, EVENT_VENDOR_PACK].map((p) => [p.vertical, p]),
);

/** Booking-first verticals that use the G2 product thread (Bookings → guest book → Today). */
export function listWedgeProductThreadVerticals(): BusinessVertical[] {
  return PRODUCT_THREAD_PACKS.map((p) => p.vertical);
}

export function getWedgeVerticalPack(vertical: BusinessVertical): WedgeVerticalPack | null {
  return PACK_BY_VERTICAL.get(vertical) ?? null;
}

export function resolveWedgeBeatAssetBase(vertical: BusinessVertical): string | null {
  const pack = getWedgeVerticalPack(vertical);
  if (!pack) return null;
  if (vertical === "beauty") return "/w2-gateway/platform-default";
  if (pack.assetFolder) return `/w2-gateway/beats/${pack.assetFolder}`;
  return null;
}
