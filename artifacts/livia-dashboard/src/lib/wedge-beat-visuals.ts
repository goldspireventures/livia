import type { BusinessVertical, WedgeDemoBeat } from "@workspace/policy";

export type WedgeBeatVisual = {
  src: string;
  alt: string;
  objectPosition?: string;
  /** Wide desktop crop vs narrow guest /b phone */
  aspect?: "wide" | "phone";
};

/** G2 beauty thread — real Livia crops (Constellation signup skin): inbox, /b, Today. */
const BEAUTY_PLATFORM_DEFAULT_VISUALS: Partial<Record<WedgeDemoBeat["cropHint"], WedgeBeatVisual>> = {
  inbox: {
    src: "/w2-gateway/platform-default/inbox.png",
    alt: "Livia inbox — thread with booking confirmation",
    objectPosition: "center top",
    aspect: "wide",
  },
  "public-book": {
    src: "/w2-gateway/platform-default/book-mobile.png",
    alt: "Guest booking on /b — Bloom Beauty on Livia platform skin",
    objectPosition: "center top",
    aspect: "phone",
  },
  today: {
    src: "/w2-gateway/platform-default/today.png",
    alt: "Owner Today — schedule and Liv briefing",
    objectPosition: "center top",
    aspect: "wide",
  },
};

const BEAUTY_THREAD_BRIDGES: Partial<Record<WedgeDemoBeat["cropHint"], string>> = {
  inbox: "Liv holds context — patch test, service, and thread history in one place.",
  "public-book": "Same guest, same brand. They book from your link without an account.",
  today: "You open Today — the chair plan, revenue, and what Liv already handled.",
};

const BEAUTY_LIV_INTRO =
  "Three surfaces, one thread — inbox, your booking link, and Today on the same Livia skin.";

/** Beauty G2 story chapters (Inbox → /b → Today). */
export const BEAUTY_WEDGE_CHAPTER_ORDER: WedgeDemoBeat["cropHint"][] = [
  "inbox",
  "public-book",
  "today",
];

export function isBeautyWedgeThread(vertical: BusinessVertical): boolean {
  return vertical === "beauty";
}

export function filterBeautyWedgeChapters(beats: WedgeDemoBeat[]): WedgeDemoBeat[] {
  const byHint = new Map(beats.map((b) => [b.cropHint, b]));
  return BEAUTY_WEDGE_CHAPTER_ORDER.map((hint) => byHint.get(hint)).filter(
    (b): b is WedgeDemoBeat => Boolean(b),
  );
}

export function resolveWedgeBeatVisual(
  vertical: BusinessVertical,
  beat: WedgeDemoBeat,
): WedgeBeatVisual | null {
  if (vertical !== "beauty") return null;
  return BEAUTY_PLATFORM_DEFAULT_VISUALS[beat.cropHint] ?? null;
}

export function resolveWedgeThreadBridge(
  vertical: BusinessVertical,
  beat: WedgeDemoBeat,
): string | null {
  if (vertical !== "beauty") return null;
  return BEAUTY_THREAD_BRIDGES[beat.cropHint] ?? null;
}

export function resolveWedgeLivIntro(vertical: BusinessVertical): string {
  if (vertical === "beauty") return BEAUTY_LIV_INTRO;
  return "Inbox, booking, and Today — then walk into the live demo.";
}

/** @deprecated beauty thread uses resolveWedgeThreadBridge */
export function resolveWedgeBeatBriefing(
  vertical: BusinessVertical,
  beat: WedgeDemoBeat,
): string | null {
  return resolveWedgeThreadBridge(vertical, beat);
}
