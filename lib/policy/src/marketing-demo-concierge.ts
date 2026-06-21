import type { BusinessVertical } from "./types";
import { getCoverageForCodeVertical } from "./vertical-coverage";
import { listWedgeDemoVerticals, listWedgeDemoVerticalsForDisplay } from "./wedge-demo-stories";

/**
 * W1 /demo concierge — wedges that are live (append one at a time as each ships).
 * Marketing portals + W2 wedge + G1 grid all read this list.
 */
export const MARKETING_DEMO_WEDGE_UNLOCK_ORDER: readonly BusinessVertical[] = [
  "beauty",
  "wellness",
  "hair",
  "medspa",
  "event-vendors",
] as const;

/**
 * Concierge grid order — beauty first, then the unlock queue left-to-right.
 */
export const MARKETING_DEMO_WEDGE_PIPELINE_ORDER: readonly BusinessVertical[] = [
  "beauty",
  "wellness",
  "hair",
  "medspa",
  "body-art",
  "fitness",
  "allied-health",
  "pet-grooming",
  "automotive-detailing",
  "event-vendors",
] as const;

/**
 * W1 /demo concierge — all registry verticals with demo stories (beta / staging testers).
 * Marketing GTM may still highlight MARKETING_DEMO_WEDGE_UNLOCK_ORDER first in copy.
 */
export function isMarketingDemoWedgeUnlocked(vertical: BusinessVertical): boolean {
  return listWedgeDemoVerticals().includes(vertical);
}

export type MarketingDemoConciergeEntry = {
  vertical: BusinessVertical;
  label: string;
  title: string;
  description: string;
  /** Path under marketing public, or null → gradient placeholder */
  imagePath: string | null;
  /** G1 trade-card filename stem on app host (`/w2-gateway/cards/{key}.jpg`) when set */
  g1CardKey: string | null;
  unlocked: boolean;
};

/** Shared G1 card crops — same assets as W2 gateway (`g1-wedge-web.target.png`). */
export const MARKETING_CONCIERGE_G1_CARD_KEY: Partial<Record<BusinessVertical, string>> = {
  beauty: "beauty",
  wellness: "wellness",
  hair: "barber",
  "body-art": "tattoo",
  medspa: "medspa",
  "event-vendors": "events",
};

/** Resolve concierge thumb — prefer app G1 card when dashboard origin known. */
export function resolveMarketingConciergeThumbUrl(
  vertical: BusinessVertical,
  opts: { dashboardOrigin?: string; marketingPublicBase?: string },
): string | null {
  const copy = CONCIERGE_COPY[vertical];
  const g1Key = MARKETING_CONCIERGE_G1_CARD_KEY[vertical];
  const dash = opts.dashboardOrigin?.replace(/\/+$/, "");
  if (g1Key && dash) {
    return `${dash}/w2-gateway/cards/${g1Key}.jpg`;
  }
  const path = copy?.imagePath;
  if (!path) return null;
  const base = opts.marketingPublicBase?.replace(/\/+$/, "") ?? "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

const CONCIERGE_COPY: Partial<
  Record<BusinessVertical, { title: string; description: string; imagePath: string | null }>
> = {
  beauty: {
    title: "Bloom Beauty · Dublin",
    description: "A premium beauty studio in the heart of Dublin 2.",
    imagePath: "/demo/portal-beauty.jpg",
  },
  wellness: {
    title: "Harbour Wellness · Cork",
    description: "Built for spas and wellness studios — rooms, vouchers, and calm booking.",
    imagePath: "/demo/portal-wellness.jpg",
  },
  hair: {
    title: "North Strand Barber",
    description: "A classic cut. A modern experience.",
    imagePath: "/demo/portal-hair.jpg",
  },
  "body-art": {
    title: "Ink Anchor · Galway",
    description: "Design proof, deposits, and session continuity.",
    imagePath: "/demo/portal-body-art.jpg",
  },
  medspa: {
    title: "Clarity Medspa · Dublin",
    description: "Consent-first aesthetics and treatment flow.",
    imagePath: "/demo/portal-medspa.jpg",
  },
  fitness: {
    title: "Peak Fitness · Dublin",
    description: "Classes, packs, and capacity-aware booking.",
    imagePath: "/demo/portal-fitness.jpg",
  },
  "allied-health": {
    title: "Motion Physio · Cork",
    description: "Simple intake for bookings — not a full medical records system.",
    imagePath: "/demo/portal-allied-health.jpg",
  },
  "pet-grooming": {
    title: "Paws Parlour · Dublin",
    description: "Pet profiles and parent-friendly reminders.",
    imagePath: "/demo/portal-pet-grooming.jpg",
  },
  "automotive-detailing": {
    title: "Shine Studio · Belfast",
    description: "Bay scheduling and vehicle notes.",
    imagePath: "/demo/portal-automotive.jpg",
  },
  "event-vendors": {
    title: "Atelier Decor · Dublin",
    description: "Enquire → quote → booked — event styling without DM chaos.",
    imagePath: "/demo/portal-events.jpg",
  },
};

/** Pipeline order — beauty first, unlock queue stacks left-to-right. */
export function listMarketingDemoConciergeEntries(): MarketingDemoConciergeEntry[] {
  const available = new Set(listWedgeDemoVerticalsForDisplay());
  const ordered: BusinessVertical[] = MARKETING_DEMO_WEDGE_PIPELINE_ORDER.filter((v) =>
    available.has(v),
  );
  for (const v of listWedgeDemoVerticalsForDisplay()) {
    if (!ordered.includes(v)) ordered.push(v);
  }
  return ordered.map((vertical) => {
    const row = getCoverageForCodeVertical(vertical);
    const copy = CONCIERGE_COPY[vertical];
    const unlocked = isMarketingDemoWedgeUnlocked(vertical);
    return {
      vertical,
      label: row?.label ?? vertical,
      title: copy?.title ?? row?.label ?? vertical,
      description: copy?.description ?? row?.revenueNote ?? "",
      imagePath: copy?.imagePath ?? null,
      g1CardKey: MARKETING_CONCIERGE_G1_CARD_KEY[vertical] ?? null,
      unlocked,
    };
  });
}
