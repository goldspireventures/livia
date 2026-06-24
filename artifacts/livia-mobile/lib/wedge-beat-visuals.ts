import type { BusinessVertical, WedgeDemoBeat } from "@workspace/policy";
import { getGatewayAssetsBaseUrl } from "@/lib/dashboard-url";

export type WedgeBeatVisual = {
  src: string;
  alt: string;
  objectPosition?: string;
  aspect?: "wide" | "phone";
};

export const WEDGE_CHAPTER_ORDER: WedgeDemoBeat["cropHint"][] = [
  "inbox",
  "public-book",
  "today",
];

const BEAUTY_PLATFORM_DEFAULT_VISUALS: Partial<Record<WedgeDemoBeat["cropHint"], Omit<WedgeBeatVisual, "src"> & { path: string }>> = {
  inbox: {
    path: "/w2-gateway/platform-default/inbox.png",
    alt: "Bloom Beauty Dublin — bookings list with pending visits",
    objectPosition: "center top",
    aspect: "wide",
  },
  "public-book": {
    path: "/w2-gateway/platform-default/book-mobile.png",
    alt: "Bloom Beauty Dublin — guest booking page",
    objectPosition: "center top",
    aspect: "phone",
  },
  today: {
    path: "/w2-gateway/platform-default/today.png",
    alt: "Bloom Beauty Dublin — owner Today with Liv briefing",
    objectPosition: "left top",
    aspect: "wide",
  },
};

const WELLNESS_HARBOUR_VISUALS: Partial<Record<WedgeDemoBeat["cropHint"], Omit<WedgeBeatVisual, "src"> & { path: string }>> = {
  inbox: {
    path: "/w2-gateway/beats/wellness/harbour-light/inbox.png",
    alt: "Harbour Wellness Cork — concierge priority inbox",
    objectPosition: "left top",
    aspect: "wide",
  },
  "public-book": {
    path: "/w2-gateway/beats/wellness/harbour-light/book-mobile.png",
    alt: "Harbour Wellness Cork — gift-ready treatment grid on booking page",
    objectPosition: "center top",
    aspect: "phone",
  },
  today: {
    path: "/w2-gateway/beats/wellness/harbour-light/today.png",
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
  "public-book": "Guests pick treatments on a spa-native booking page — gift-ready, not salon chrome.",
  today: "Room swimlanes show turnover, vouchers, and who's in Serenity next.",
};

const BEAUTY_LIV_INTRO =
  "Three surfaces, one thread — bookings, your booking link, and Today at Bloom Beauty Dublin.";

const WELLNESS_LIV_INTRO =
  "Three surfaces, one thread — concierge, your booking link, and the room board at Harbour Wellness Cork.";

const WEDGE_THREAD_VERTICALS = new Set<BusinessVertical>(["beauty", "wellness"]);

function assetUrl(path: string): string {
  return `${getGatewayAssetsBaseUrl()}${path}`;
}

export function isPresetWedgeThread(vertical: BusinessVertical): boolean {
  return WEDGE_THREAD_VERTICALS.has(vertical);
}

export function filterWedgeChapters(beats: WedgeDemoBeat[]): WedgeDemoBeat[] {
  const byHint = new Map(beats.map((b) => [b.cropHint, b]));
  return WEDGE_CHAPTER_ORDER.map((hint) => byHint.get(hint)).filter(
    (b): b is WedgeDemoBeat => Boolean(b),
  );
}

export function resolveWedgeBeatVisual(
  vertical: BusinessVertical,
  beat: WedgeDemoBeat,
): WedgeBeatVisual | null {
  const map =
    vertical === "beauty"
      ? BEAUTY_PLATFORM_DEFAULT_VISUALS
      : vertical === "wellness"
        ? WELLNESS_HARBOUR_VISUALS
        : null;
  const entry = map?.[beat.cropHint];
  if (!entry) return null;
  const { path, ...rest } = entry;
  return { src: assetUrl(path), ...rest };
}

export function resolveWedgeThreadBridge(
  vertical: BusinessVertical,
  beat: WedgeDemoBeat,
): string | null {
  if (vertical === "beauty") return BEAUTY_THREAD_BRIDGES[beat.cropHint] ?? null;
  if (vertical === "wellness") return WELLNESS_THREAD_BRIDGES[beat.cropHint] ?? null;
  return null;
}

export function resolveWedgeLivIntro(vertical: BusinessVertical): string {
  if (vertical === "beauty") return BEAUTY_LIV_INTRO;
  if (vertical === "wellness") return WELLNESS_LIV_INTRO;
  return "Inbox, booking, and Today — then walk into the live demo.";
}

export const WEDGE_BEAT_CROP_META: Record<
  string,
  { label: string; ring: string; chipBg: string; chipText: string }
> = {
  inbox: { label: "Inbox", ring: "#8b5cf655", chipBg: "#8b5cf626", chipText: "#c4b5fd" },
  "public-book": { label: "Book", ring: "#06b6d455", chipBg: "#06b6d426", chipText: "#67e8f9" },
  proof: { label: "Proof", ring: "#f59e0b55", chipBg: "#f59e0b26", chipText: "#fcd34d" },
  consent: { label: "Consent", ring: "#fb718555", chipBg: "#fb718526", chipText: "#fda4af" },
  sms: { label: "SMS", ring: "#10b98155", chipBg: "#10b98126", chipText: "#6ee7b7" },
  today: { label: "Today", ring: "#38bdf855", chipBg: "#38bdf826", chipText: "#7dd3fc" },
};
