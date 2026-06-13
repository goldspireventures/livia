import {
  isMarketingDemoWedgeUnlocked,
  type BusinessVertical,
} from "@workspace/policy";

/** Curated G1 worlds — layout matches `g1-wedge-web.target.png` (six portrait cards). */
export type G1WedgeWorld = {
  key: string;
  vertical: BusinessVertical;
  /** Seeded demo tenant for this G1 card (distinct shops even when vertical matches). */
  demoSlug: string;
  businessLabel: string;
  title: string;
  tagline: string;
  /**
   * Hero photo clipped inside the gold frame (northstar wells).
   * Regenerate: `python scripts/extract-g1-card-photos.py`
   */
  imageUrl: string;
  /** Optional `object-position` for portrait focal point. */
  photoPosition?: string;
};

export const G1_WEDGE_WORLDS: G1WedgeWorld[] = [
  {
    key: "tattoo",
    vertical: "body-art",
    demoSlug: "ink-anchor-galway",
    businessLabel: "Ink Anchor · Galway",
    title: "Tattoo studio",
    tagline: "Ink stories. Build legacies.",
    imageUrl: "/w2-gateway/cards/tattoo.jpg",
    photoPosition: "center 22%",
  },
  {
    key: "barber",
    vertical: "hair",
    demoSlug: "dublin-barber-collective",
    businessLabel: "Dublin Barber Collective",
    title: "Barber shop",
    tagline: "Craft fades. Build culture.",
    imageUrl: "/w2-gateway/cards/barber.jpg",
    photoPosition: "62% center",
  },
  {
    key: "medspa",
    vertical: "medspa",
    demoSlug: "clarity-medspa-dublin",
    businessLabel: "Clarity Medspa · Dublin",
    title: "Medspa",
    tagline: "Elevate care. Empower transformation.",
    imageUrl: "/w2-gateway/cards/medspa.jpg",
    photoPosition: "center 35%",
  },
  {
    key: "hair",
    vertical: "hair",
    demoSlug: "luxe-salon-spa",
    businessLabel: "Luxe Salon & Spa",
    title: "Hair salon",
    tagline: "Style lives. Shape confidence.",
    imageUrl: "/w2-gateway/cards/hair.jpg",
    photoPosition: "center 28%",
  },
  {
    key: "beauty",
    vertical: "beauty",
    demoSlug: "bloom-beauty-dublin",
    businessLabel: "Bloom Beauty · Dublin",
    title: "Beauty studio",
    tagline: "Bloom Beauty · lash, brow & nails",
    imageUrl: "/w2-gateway/cards/beauty.jpg",
    photoPosition: "center 40%",
  },
  {
    key: "wellness",
    vertical: "wellness",
    demoSlug: "harbour-wellness-cork",
    businessLabel: "Harbour Wellness · Cork",
    title: "Wellness studio",
    tagline: "Balance body. Align energy. Live well.",
    imageUrl: "/w2-gateway/cards/wellness.jpg",
    photoPosition: "center 30%",
  },
  {
    key: "events",
    vertical: "event-vendors",
    demoSlug: "atelier-decor-dublin",
    businessLabel: "Atelier Decor · Dublin",
    title: "Event styling",
    tagline: "Enquire. Quote. Celebrate.",
    imageUrl: "/w2-gateway/cards/events.jpg",
    photoPosition: "center 40%",
  },
];

/** Unlocked worlds first; stable order within each tier. */
export function listG1WedgeWorldsForDisplay(): G1WedgeWorld[] {
  return G1_WEDGE_WORLDS.map((world, index) => ({ world, index }))
    .sort((a, b) => {
      const tier = (v: BusinessVertical) => (isMarketingDemoWedgeUnlocked(v) ? 0 : 1);
      return tier(a.world.vertical) - tier(b.world.vertical) || a.index - b.index;
    })
    .map(({ world }) => world);
}

export function isG1WedgeWorldUnlocked(vertical: BusinessVertical): boolean {
  return isMarketingDemoWedgeUnlocked(vertical);
}

export function getG1WedgeWorld(worldKey: string | null | undefined): G1WedgeWorld | null {
  if (!worldKey) return null;
  return G1_WEDGE_WORLDS.find((w) => w.key === worldKey) ?? null;
}

/** Resolve G1 world from route — prefers explicit world key, else first match for vertical. */
export function resolveG1WedgeWorld(
  vertical: BusinessVertical,
  worldKey?: string | null,
): G1WedgeWorld | null {
  return getG1WedgeWorld(worldKey) ?? G1_WEDGE_WORLDS.find((w) => w.vertical === vertical) ?? null;
}

/** G1 card copy carried into G2 — no bait-and-switch from the world they picked. */
export function g1TaglineForWorld(world: G1WedgeWorld | null): string | null {
  return world?.tagline ?? null;
}

export function g1TitleForWorld(world: G1WedgeWorld | null): string | null {
  return world?.title ?? null;
}

/** @deprecated prefer g1TitleForWorld with resolveG1WedgeWorld */
export function g1TaglineForVertical(vertical: BusinessVertical): string | null {
  return G1_WEDGE_WORLDS.find((w) => w.vertical === vertical)?.tagline ?? null;
}

/** @deprecated prefer g1TitleForWorld with resolveG1WedgeWorld */
export function g1TitleForVertical(vertical: BusinessVertical): string | null {
  return G1_WEDGE_WORLDS.find((w) => w.vertical === vertical)?.title ?? null;
}
