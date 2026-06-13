import type { BusinessVertical, WedgeDemoBeat } from "@workspace/policy";

export type WedgeBeatVisual = {
  src: string;
  alt: string;
  objectPosition?: string;
  /** Wide desktop crop vs narrow guest /b phone */
  aspect?: "wide" | "phone";
};

/** G2 product thread chapter order (Inbox → /b → Today). */
export const WEDGE_CHAPTER_ORDER: WedgeDemoBeat["cropHint"][] = [
  "inbox",
  "public-book",
  "today",
];

/** Consult-first event vendors — operator superpowers, not booking chrome. */
export const EVENT_VENDOR_CHAPTER_ORDER: WedgeDemoBeat["cropHint"][] = [
  "inbox",
  "quote-gen",
  "catalogue",
  "milestone-pay",
];

export function wedgeChapterOrder(vertical?: BusinessVertical): WedgeDemoBeat["cropHint"][] {
  if (vertical === "event-vendors") return EVENT_VENDOR_CHAPTER_ORDER;
  return WEDGE_CHAPTER_ORDER;
}

const BEAUTY_PLATFORM_DEFAULT_VISUALS: Partial<Record<WedgeDemoBeat["cropHint"], WedgeBeatVisual>> = {
  inbox: {
    src: "/w2-gateway/platform-default/inbox.png",
    alt: "Bloom Beauty Dublin — bookings list with pending visits",
    objectPosition: "center top",
    aspect: "wide",
  },
  "public-book": {
    src: "/w2-gateway/platform-default/book-mobile.png",
    alt: "Bloom Beauty Dublin — guest booking page on /b",
    objectPosition: "center top",
    aspect: "phone",
  },
  today: {
    src: "/w2-gateway/platform-default/today.png",
    alt: "Bloom Beauty Dublin — owner Today with Liv briefing",
    objectPosition: "left top",
    aspect: "wide",
  },
};

/** Wellness G2 — Harbour demo preset (vertical default). */
const WELLNESS_HARBOUR_VISUALS: Partial<Record<WedgeDemoBeat["cropHint"], WedgeBeatVisual>> = {
  inbox: {
    src: "/w2-gateway/beats/wellness/harbour-light/inbox.png",
    alt: "Harbour Wellness Cork — concierge priority inbox",
    objectPosition: "left top",
    aspect: "wide",
  },
  "public-book": {
    src: "/w2-gateway/beats/wellness/harbour-light/book-mobile.png",
    alt: "Harbour Wellness Cork — gift-ready treatment grid on /b",
    objectPosition: "center top",
    aspect: "phone",
  },
  today: {
    src: "/w2-gateway/beats/wellness/harbour-light/today.png",
    alt: "Harbour Wellness Cork — room swimlanes Today",
    objectPosition: "left top",
    aspect: "wide",
  },
};

const BEAUTY_THREAD_BRIDGES: Partial<Record<WedgeDemoBeat["cropHint"], string>> = {
  inbox: "Pending visits line up — confirm or guide without leaving the list.",
  "public-book": "Same guest, same brand. They book from your link without an account.",
  today: "You open Today — the chair plan, revenue, and what Liv already handled.",
};

const WELLNESS_THREAD_BRIDGES: Partial<Record<WedgeDemoBeat["cropHint"], string>> = {
  inbox: "Gift vouchers and calm SMS land in concierge — Liv holds the room fit.",
  "public-book": "Guests pick treatments on a spa-native /b — gift-ready, not salon chrome.",
  today: "Room swimlanes show turnover, vouchers, and who's in Serenity next.",
};

const BEAUTY_LIV_INTRO =
  "Three surfaces, one thread — bookings, your /b link, and Today at Bloom Beauty Dublin.";

const WELLNESS_LIV_INTRO =
  "Three surfaces, one thread — concierge, your /b link, and the room board at Harbour Wellness Cork.";

const EVENT_VENDOR_THREAD_BRIDGES: Partial<Record<WedgeDemoBeat["cropHint"], string>> = {
  inbox: "Sarah's birthday lands from WhatsApp — Liv acknowledges and pre-screens budget fit.",
  "quote-gen": "One tap: birthday template + guest count → line items, deposit %, PDF-ready quote.",
  catalogue: "Per-table centrepieces and per-guest sashes — quantities scale from the enquiry brief.",
};

const EVENT_VENDOR_LIV_INTRO =
  "The three things no decor studio has in one place — every lead, quotes that write themselves, and a catalogue that thinks in events.";

const WEDGE_THREAD_VERTICALS = new Set<BusinessVertical>(["beauty", "wellness", "event-vendors"]);

export function isPresetWedgeThread(vertical: BusinessVertical): boolean {
  return WEDGE_THREAD_VERTICALS.has(vertical);
}

/** @deprecated use isPresetWedgeThread */
export function isBeautyWedgeThread(vertical: BusinessVertical): boolean {
  return isPresetWedgeThread(vertical);
}

export function filterWedgeChapters(
  beats: WedgeDemoBeat[],
  vertical?: BusinessVertical,
): WedgeDemoBeat[] {
  const order = wedgeChapterOrder(vertical);
  const byHint = new Map(beats.map((b) => [b.cropHint, b]));
  return order.map((hint) => byHint.get(hint)).filter((b): b is WedgeDemoBeat => Boolean(b));
}

/** @deprecated use filterWedgeChapters */
export function filterBeautyWedgeChapters(beats: WedgeDemoBeat[]): WedgeDemoBeat[] {
  return filterWedgeChapters(beats);
}

export function resolveWedgeBeatVisual(
  vertical: BusinessVertical,
  beat: WedgeDemoBeat,
): WedgeBeatVisual | null {
  if (vertical === "beauty") {
    return BEAUTY_PLATFORM_DEFAULT_VISUALS[beat.cropHint] ?? null;
  }
  if (vertical === "wellness") {
    return WELLNESS_HARBOUR_VISUALS[beat.cropHint] ?? null;
  }
  return null;
}

export function resolveWedgeThreadBridge(
  vertical: BusinessVertical,
  beat: WedgeDemoBeat,
): string | null {
  if (vertical === "beauty") return BEAUTY_THREAD_BRIDGES[beat.cropHint] ?? null;
  if (vertical === "wellness") return WELLNESS_THREAD_BRIDGES[beat.cropHint] ?? null;
  if (vertical === "event-vendors") return EVENT_VENDOR_THREAD_BRIDGES[beat.cropHint] ?? null;
  return null;
}

export function resolveWedgeLivIntro(vertical: BusinessVertical): string {
  if (vertical === "beauty") return BEAUTY_LIV_INTRO;
  if (vertical === "wellness") return WELLNESS_LIV_INTRO;
  if (vertical === "event-vendors") return EVENT_VENDOR_LIV_INTRO;
  return "Inbox, booking, and Today — then walk into the live demo.";
}

/** @deprecated beauty thread uses resolveWedgeThreadBridge */
export function resolveWedgeBeatBriefing(
  vertical: BusinessVertical,
  beat: WedgeDemoBeat,
): string | null {
  return resolveWedgeThreadBridge(vertical, beat);
}
