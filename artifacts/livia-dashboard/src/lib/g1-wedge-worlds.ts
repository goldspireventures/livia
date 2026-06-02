import type { BusinessVertical } from "@workspace/policy";

/** Curated G1 worlds — layout matches `g1-wedge-web.target.png` (six portrait cards). */
export type G1WedgeWorld = {
  key: string;
  vertical: BusinessVertical;
  title: string;
  tagline: string;
  /** Decorative card art — moody trade photography. */
  imageUrl: string;
};

export const G1_WEDGE_WORLDS: G1WedgeWorld[] = [
  {
    key: "tattoo",
    vertical: "body-art",
    title: "Tattoo salon",
    tagline: "Ink stories. Build legacies.",
    imageUrl:
      "https://images.unsplash.com/photo-1598371839696-5c5bb00af926?auto=format&fit=crop&w=600&q=80",
  },
  {
    key: "barber",
    vertical: "hair",
    title: "Barber shop",
    tagline: "Craft fades. Build culture.",
    imageUrl:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80",
  },
  {
    key: "medspa",
    vertical: "medspa",
    title: "Medspa",
    tagline: "Elevate care. Empower transformation.",
    imageUrl:
      "https://images.unsplash.com/photo-1570172619644-dfd955f4818e?auto=format&fit=crop&w=600&q=80",
  },
  {
    key: "hair",
    vertical: "hair",
    title: "Hair salon",
    tagline: "Style lives. Shape confidence.",
    imageUrl:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
  },
  {
    key: "beauty",
    vertical: "beauty",
    title: "Lash & brow",
    tagline: "Define the details. Reveal the you.",
    imageUrl:
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=600&q=80",
  },
  {
    key: "wellness",
    vertical: "wellness",
    title: "Wellness studio",
    tagline: "Balance body. Align energy. Live well.",
    imageUrl:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
  },
];

/** Verticals with a shipped wedge story on staging. */
export const G1_WEDGE_UNLOCKED = new Set<BusinessVertical>(["beauty"]);
