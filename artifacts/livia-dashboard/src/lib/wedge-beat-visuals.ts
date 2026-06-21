import type { BusinessVertical, WedgeDemoBeat } from "@workspace/policy";
import {
  getWedgeVerticalPack,
  listWedgeProductThreadVerticals,
  resolveWedgeBeatAssetBase,
} from "@workspace/policy";

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

const CROP_FILE: Partial<Record<WedgeDemoBeat["cropHint"], string>> = {
  inbox: "inbox.png",
  "public-book": "book-mobile.png",
  today: "today.png",
  "quote-gen": "quote-gen.png",
  catalogue: "catalogue.png",
  "milestone-pay": "milestone-pay.png",
};

const CROP_ASPECT: Partial<Record<WedgeDemoBeat["cropHint"], WedgeBeatVisual["aspect"]>> = {
  inbox: "wide",
  "public-book": "phone",
  today: "wide",
  "quote-gen": "wide",
  catalogue: "wide",
  "milestone-pay": "phone",
};

const CROP_OBJECT_POSITION: Partial<Record<WedgeDemoBeat["cropHint"], string>> = {
  inbox: "left top",
  "public-book": "center top",
  today: "left top",
  "quote-gen": "left top",
  catalogue: "center top",
  "milestone-pay": "center top",
};

export function wedgeChapterOrder(vertical?: BusinessVertical): WedgeDemoBeat["cropHint"][] {
  if (vertical === "event-vendors") return EVENT_VENDOR_CHAPTER_ORDER;
  return WEDGE_CHAPTER_ORDER;
}

const PRODUCT_THREAD_VERTICALS = new Set<BusinessVertical>(listWedgeProductThreadVerticals());

export function isPresetWedgeThread(vertical: BusinessVertical): boolean {
  return PRODUCT_THREAD_VERTICALS.has(vertical);
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

function cropAlt(packLabel: string, cropHint: WedgeDemoBeat["cropHint"]): string {
  switch (cropHint) {
    case "inbox":
      return `${packLabel} — bookings and inquiries ready to confirm`;
    case "public-book":
      return `${packLabel} — guest booking page`;
    case "today":
      return `${packLabel} — owner Today with Liv briefing`;
    case "quote-gen":
      return `${packLabel} — line-item quote generator with deposit`;
    case "catalogue":
      return `${packLabel} — public services catalogue`;
    case "milestone-pay":
      return `${packLabel} — guest quote accept and milestone deposit`;
    default:
      return packLabel;
  }
}

export function resolveWedgeBeatVisual(
  vertical: BusinessVertical,
  beat: WedgeDemoBeat,
): WedgeBeatVisual | null {
  const pack = getWedgeVerticalPack(vertical);
  const base = resolveWedgeBeatAssetBase(vertical);
  const file = CROP_FILE[beat.cropHint];
  if (!pack || !base || !file) return null;

  return {
    src: `${base}/${file}`,
    alt: cropAlt(pack.businessLabel, beat.cropHint),
    objectPosition: CROP_OBJECT_POSITION[beat.cropHint],
    aspect: CROP_ASPECT[beat.cropHint],
  };
}

export function resolveWedgeThreadBridge(
  vertical: BusinessVertical,
  beat: WedgeDemoBeat,
): string | null {
  return getWedgeVerticalPack(vertical)?.bridges[beat.cropHint] ?? null;
}

export function resolveWedgeLivIntro(vertical: BusinessVertical): string {
  return (
    getWedgeVerticalPack(vertical)?.livIntro ??
    "Inbox, booking, and Today — then walk into the live demo."
  );
}

export function resolveWedgeArc(vertical: BusinessVertical): string {
  return getWedgeVerticalPack(vertical)?.arc ?? "From inquiry to done";
}

export function resolveWedgeChapterLabel(
  vertical: BusinessVertical,
  cropHint: WedgeDemoBeat["cropHint"],
): string {
  if (vertical === "event-vendors") {
    const labels: Partial<Record<WedgeDemoBeat["cropHint"], string>> = {
      inbox: "Inbox",
      "quote-gen": "Quote generator",
      catalogue: "Catalogue",
      "milestone-pay": "Accept & pay",
    };
    return labels[cropHint] ?? cropHint;
  }
  const labels: Partial<Record<WedgeDemoBeat["cropHint"], string>> = {
    inbox: vertical === "wellness" ? "Concierge" : "Bookings",
    "public-book": "Book online",
    today: "Today",
  };
  return labels[cropHint] ?? cropHint;
}

/** @deprecated beauty thread uses resolveWedgeThreadBridge */
export function resolveWedgeBeatBriefing(
  vertical: BusinessVertical,
  beat: WedgeDemoBeat,
): string | null {
  return resolveWedgeThreadBridge(vertical, beat);
}
