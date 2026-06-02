import type { BusinessVertical } from "./types";
import { getCoverageForCodeVertical } from "./vertical-coverage";
import { listWedgeDemoVerticalsForDisplay } from "./wedge-demo-stories";

/**
 * W1 /demo concierge — unlock in completion order (append as wedge ships).
 * Marketing portals + W2 wedge + G1 grid all read this list.
 */
export const MARKETING_DEMO_WEDGE_UNLOCK_ORDER: readonly BusinessVertical[] = [
  "beauty",
  "wellness",
  "hair",
] as const;

export function isMarketingDemoWedgeUnlocked(vertical: BusinessVertical): boolean {
  return (MARKETING_DEMO_WEDGE_UNLOCK_ORDER as readonly string[]).includes(vertical);
}

export type MarketingDemoConciergeEntry = {
  vertical: BusinessVertical;
  label: string;
  title: string;
  description: string;
  /** Path under marketing public, or null → gradient placeholder */
  imagePath: string | null;
  unlocked: boolean;
};

const CONCIERGE_COPY: Partial<
  Record<BusinessVertical, { title: string; description: string; imagePath: string | null }>
> = {
  beauty: {
    title: "Bloom Beauty · Dublin",
    description: "A premium beauty studio in the heart of Dublin 2.",
    imagePath: "/demo/portal-beauty.jpg",
  },
  wellness: {
    title: "Calm Wellness · Cork",
    description: "A modern wellness space for mind and body.",
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
    imagePath: null,
  },
  medspa: {
    title: "Clarity Medspa · Dublin",
    description: "Consent-first aesthetics and treatment flow.",
    imagePath: null,
  },
  fitness: {
    title: "Peak Fitness · Dublin",
    description: "Classes, packs, and capacity-aware booking.",
    imagePath: null,
  },
  "allied-health": {
    title: "Motion Physio · Cork",
    description: "Lite clinic intake — not an EHR.",
    imagePath: null,
  },
  "pet-grooming": {
    title: "Paws Parlour · Dublin",
    description: "Pet profiles and parent-friendly reminders.",
    imagePath: null,
  },
  "automotive-detailing": {
    title: "Shine Studio · Belfast",
    description: "Bay scheduling and vehicle notes.",
    imagePath: null,
  },
};

/** Registry order — locked rows stay visible in pipeline position. */
export function listMarketingDemoConciergeEntries(): MarketingDemoConciergeEntry[] {
  return listWedgeDemoVerticalsForDisplay().map((vertical) => {
    const row = getCoverageForCodeVertical(vertical);
    const copy = CONCIERGE_COPY[vertical];
    const unlocked = isMarketingDemoWedgeUnlocked(vertical);
    return {
      vertical,
      label: row?.label ?? vertical,
      title: copy?.title ?? row?.label ?? vertical,
      description: copy?.description ?? row?.revenueNote ?? "",
      imagePath: copy?.imagePath ?? null,
      unlocked,
    };
  });
}
