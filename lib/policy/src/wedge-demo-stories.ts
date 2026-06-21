import type { BusinessVertical } from "./types";
import { VERTICAL_COVERAGE_REGISTRY } from "./vertical-coverage";

export type WedgeDemoBeat = {
  /** One sentence + UI hint (inbox row, /b hero, SMS mock, Today card). */
  headline: string;
  /** Short subline for interstitial card. */
  detail: string;
  /** Visual hint for design/dev galleries — not user-facing. */
  cropHint:
    | "inbox"
    | "public-book"
    | "sms"
    | "today"
    | "proof"
    | "consent"
    | "quote-gen"
    | "catalogue"
    | "milestone-pay";
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
    {
      headline: "Consult lands in your Inbox",
      detail: "Every DM becomes a thread Liv can act on — deposit policy stays attached.",
      cropHint: "inbox",
    },
    {
      headline: "Guest books online",
      detail: "Consults and sessions from your link — deposit holds the slot.",
      cropHint: "public-book",
    },
    {
      headline: "Today — who's in the chair",
      detail: "Artists see the day, proof status, and what's next.",
      cropHint: "today",
    },
  ],
  hair: [
    {
      headline: "Instagram DM → Bookings",
      detail: "Liv catches the inquiry before you put down the scissors.",
      cropHint: "inbox",
    },
    {
      headline: "Client books from your link",
      detail: "Professional booking page — your brand, not a generic widget.",
      cropHint: "public-book",
    },
    {
      headline: "Today — who's next",
      detail: "The whole shop on one calm screen.",
      cropHint: "today",
    },
  ],
  beauty: [
    {
      headline: "Bookings ready to confirm",
      detail: "Pending visits, walk-ins, and guided booking — one list before you touch the calendar.",
      cropHint: "inbox",
    },
    {
      headline: "Guest books online",
      detail: "Your menu, durations, and intake guards on a link-in-bio page — no account required.",
      cropHint: "public-book",
    },
    {
      headline: "Today keeps the floor calm",
      detail: "Liv briefing, schedule, and what needs you — one Constellation dashboard.",
      cropHint: "today",
    },
  ],
  medspa: [
    {
      headline: "Consult request captured",
      detail: "Liv triages before clinical time is spent.",
      cropHint: "inbox",
    },
    {
      headline: "Consent on book",
      detail: "Guest signs consent when they book online — audit trail for you.",
      cropHint: "public-book",
    },
    {
      headline: "Today — treatment flow",
      detail: "Sessions, consent status, one glance.",
      cropHint: "today",
    },
  ],
  wellness: [
    {
      headline: "Concierge thread ready",
      detail: "Gift vouchers, calm SMS, and room-fit requests — Liv triages before you reply.",
      cropHint: "inbox",
    },
    {
      headline: "Guest books online",
      detail: "Treatment grid, gift-ready copy, and session lengths — spa-native storefront.",
      cropHint: "public-book",
    },
    {
      headline: "Room board stays calm",
      detail: "Swimlanes per room, voucher liability, and turnover Liv already respected.",
      cropHint: "today",
    },
  ],
  fitness: [
    {
      headline: "Class inquiry",
      detail: "Waitlist and packages in one thread.",
      cropHint: "inbox",
    },
    {
      headline: "Book or join waitlist",
      detail: "Capacity-aware online booking flow.",
      cropHint: "public-book",
    },
    {
      headline: "Today — floor & PT",
      detail: "Who's checked in, who's due.",
      cropHint: "today",
    },
  ],
  "allied-health": [
    {
      headline: "Intake message",
      detail: "Lite clinic flow — not an EHR.",
      cropHint: "inbox",
    },
    {
      headline: "Book appointment",
      detail: "Prep notes and jurisdiction copy on your booking page.",
      cropHint: "public-book",
    },
    {
      headline: "Today — practitioners",
      detail: "Day list with context, not codes.",
      cropHint: "today",
    },
  ],
  "pet-grooming": [
    {
      headline: "Pet parent inquiry",
      detail: "Breed, behaviour — Liv keeps context.",
      cropHint: "inbox",
    },
    {
      headline: "Book + pet profile",
      detail: "Parent books; pet record follows.",
      cropHint: "public-book",
    },
    {
      headline: "Today — who's on the table",
      detail: "Groomers see pets, not just names.",
      cropHint: "today",
    },
  ],
  "automotive-detailing": [
    {
      headline: "Vehicle / slot inquiry",
      detail: "Valeting requests land in Inbox.",
      cropHint: "inbox",
    },
    {
      headline: "Book detail session",
      detail: "Slot + service on your booking page.",
      cropHint: "public-book",
    },
    {
      headline: "Today — bay schedule",
      detail: "What's in, what's next.",
      cropHint: "today",
    },
  ],
  "event-vendors": [
    {
      headline: "Unified inbox",
      detail: "Instagram, WhatsApp, email, and web enquire — one thread per celebration, Liv on draft.",
      cropHint: "inbox",
    },
    {
      headline: "Quote generator",
      detail: "Enquiry brief → template + catalogue → itemised quote in under a minute. Tweak, send, done.",
      cropHint: "quote-gen",
    },
    {
      headline: "Your catalogue",
      detail: "Balloon garlands, per-table centrepieces, per-guest sashes — units that scale quotes automatically.",
      cropHint: "catalogue",
    },
    {
      headline: "Accept & milestone pay",
      detail: "Guest accepts on their phone — deposit secures the date; balance milestones collect automatically.",
      cropHint: "milestone-pay",
    },
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

/**
 * GTM display order — people-business story first (body-art clarity standard),
 * hair last on the grid so non-hair verticals sit above the fold.
 */
const WEDGE_DEMO_DISPLAY_ORDER: BusinessVertical[] = [
  "body-art",
  "medspa",
  "wellness",
  "beauty",
  "fitness",
  "allied-health",
  "pet-grooming",
  "automotive-detailing",
  "event-vendors",
  "hair",
];

export function listWedgeDemoVerticalsForDisplay(): BusinessVertical[] {
  const available = new Set(listWedgeDemoVerticals());
  return WEDGE_DEMO_DISPLAY_ORDER.filter((v) => available.has(v));
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
