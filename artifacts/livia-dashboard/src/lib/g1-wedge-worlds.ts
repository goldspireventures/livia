import type { BusinessVertical } from "@workspace/policy";

/** Curated G1 worlds — layout matches `g1-wedge-web.target.png` (six portrait cards). */
export type G1WedgeWorld = {
  key: string;
  vertical: BusinessVertical;
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
    title: "Tattoo studio",
    tagline: "Ink stories. Build legacies.",
    imageUrl: "/w2-gateway/cards/tattoo.jpg",
    photoPosition: "center 22%",
  },
  {
    key: "barber",
    vertical: "hair",
    title: "Barber shop",
    tagline: "Craft fades. Build culture.",
    imageUrl: "/w2-gateway/cards/barber.jpg",
    photoPosition: "62% center",
  },
  {
    key: "medspa",
    vertical: "medspa",
    title: "Medspa",
    tagline: "Elevate care. Empower transformation.",
    imageUrl: "/w2-gateway/cards/medspa.jpg",
    photoPosition: "center 35%",
  },
  {
    key: "hair",
    vertical: "hair",
    title: "Hair salon",
    tagline: "Style lives. Shape confidence.",
    imageUrl: "/w2-gateway/cards/hair.jpg",
    photoPosition: "center 28%",
  },
  {
    key: "beauty",
    vertical: "beauty",
    title: "Lash & brow",
    tagline: "Define the details. Reveal the you.",
    imageUrl: "/w2-gateway/cards/beauty.jpg",
    photoPosition: "center 40%",
  },
  {
    key: "wellness",
    vertical: "wellness",
    title: "Wellness studio",
    tagline: "Balance body. Align energy. Live well.",
    imageUrl: "/w2-gateway/cards/wellness.jpg",
    photoPosition: "center 30%",
  },
];

/** Verticals with a shipped wedge story on staging. */
export const G1_WEDGE_UNLOCKED = new Set<BusinessVertical>(["beauty"]);

/** Unlocked worlds first; stable order within each tier. */
export function listG1WedgeWorldsForDisplay(): G1WedgeWorld[] {
  return G1_WEDGE_WORLDS.map((world, index) => ({ world, index }))
    .sort((a, b) => {
      const tier = (v: BusinessVertical) => (G1_WEDGE_UNLOCKED.has(v) ? 0 : 1);
      return tier(a.world.vertical) - tier(b.world.vertical) || a.index - b.index;
    })
    .map(({ world }) => world);
}
