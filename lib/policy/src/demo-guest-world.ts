/**
 * Demo end-client graph — three real-life guests across operator shapes.
 * API seeds and smoke checks read this hub; surfaces never hardcode phones.
 */

export type DemoEndClientId = "mary" | "sean" | "orla";

export type DemoEndClient = {
  id: DemoEndClientId;
  phoneE164: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  /** Guest narrative for docs / launcher copy */
  story: string;
  /** Businesses this guest is linked to in `/my` */
  linkedSlugs: readonly string[];
  /** Upcoming visit offset (days from today) per slug — omit to clear noise */
  upcomingDaysBySlug: Readonly<Record<string, number>>;
  /** Grant demo package credits at these slugs */
  packageCreditSlugs?: readonly string[];
};

/** Vertical showcase — Mary is the cross-vertical explorer (GTM Wave 1). */
export const DEMO_GUEST_SHOWCASE_SLUGS = [
  "luxe-salon-spa",
  "bloom-beauty-dublin",
  "harbour-wellness-cork",
  "ink-anchor-galway",
  "clarity-medspa-dublin",
  "motion-physio-cork",
  "peak-fitness-dublin",
  "paws-parlour-dublin",
  "shine-studio-belfast",
  "atelier-decor-dublin",
] as const;

/** Operator archetypes for manual + automated Liv checks */
export const DEMO_OPERATOR_EXPERIENCE = {
  soloBarber: {
    slug: "stoneybatter-cuts",
    tier: "solo" as const,
    subverticalProfileId: "hair.barber",
    ownerEmailLocal: "owner-stoney",
    story: "Conor runs the chair alone — Sean is a regular; Liv holds inbox and deposits.",
  },
  studioBarber: {
    slug: "dublin-barber-collective",
    tier: "studio" as const,
    subverticalProfileId: "hair.barber",
    ownerEmailLocal: "owner-barber",
    story: "Six-chair shop — handoffs, rota, and manager queue; Mary and Sean both book here.",
  },
  soloWellness: {
    slug: "dundrum-serenity-spa",
    tier: "solo" as const,
    subverticalProfileId: "wellness.massage",
    ownerEmailLocal: "owner-serenity",
    story: "Maeve solo spa room — Orla redeems session packs; co-tenant at Dundrum House.",
  },
} as const;

export type DemoOperatorExperienceKey = keyof typeof DEMO_OPERATOR_EXPERIENCE;

export const DEMO_OPERATOR_SLUGS = Object.values(DEMO_OPERATOR_EXPERIENCE).map((o) => o.slug);

export function guestHubDemoBookingNote(displayName: string): string {
  return `Demo guest hub — ${displayName}`;
}

export const GUEST_HUB_DEMO_BOOKING_NOTE = guestHubDemoBookingNote("Mary McNamara");

/** @deprecated use guestHubDemoBookingNote — kept for imports */
export const MARY_GUEST_HUB_UPCOMING_DAYS: Record<string, number> = {
  "luxe-salon-spa": 4,
  "bloom-beauty-dublin": 9,
  "harbour-wellness-cork": 14,
  "motion-physio-cork": 21,
  "ink-anchor-galway": 28,
  "clarity-medspa-dublin": 7,
  "peak-fitness-dublin": 11,
  "paws-parlour-dublin": 12,
  "shine-studio-belfast": 16,
  "atelier-decor-dublin": 19,
};

export const DEMO_END_CLIENTS: DemoEndClient[] = [
  {
    id: "mary",
    phoneE164: "+353871000001",
    firstName: "Mary",
    lastName: "McNamara",
    displayName: "Mary McNamara",
    email: "mary.m@email.ie",
    story:
      "Multi-vertical regular — colour, lash, spa, tattoo consult, physio plan, event decor quote. Tests `/my` vault breadth.",
    linkedSlugs: DEMO_GUEST_SHOWCASE_SLUGS,
    upcomingDaysBySlug: MARY_GUEST_HUB_UPCOMING_DAYS,
    packageCreditSlugs: ["harbour-wellness-cork", "peak-fitness-dublin"],
  },
  {
    id: "sean",
    phoneE164: "+353871000002",
    firstName: "Sean",
    lastName: "Kelly",
    displayName: "Sean Kelly",
    email: "sean.k@email.ie",
    story:
      "Loyal to solo barber Conor — skin fade every few weeks; occasional studio hot-towel shave.",
    linkedSlugs: [
      "stoneybatter-cuts",
      "dublin-barber-collective",
      "dundrum-hair-studio",
      "conors-cut-co",
    ],
    upcomingDaysBySlug: {
      "stoneybatter-cuts": 2,
      "dublin-barber-collective": 11,
      "dundrum-hair-studio": 18,
      "conors-cut-co": 25,
    },
  },
  {
    id: "orla",
    phoneE164: "+353871000003",
    firstName: "Orla",
    lastName: "Murphy",
    displayName: "Orla Murphy",
    email: "orla.m@email.ie",
    story:
      "Wellness-first — massage at Serenity, harbour day spa, brow touch-up upstairs at Dundrum House.",
    linkedSlugs: [
      "dundrum-serenity-spa",
      "harbour-wellness-cork",
      "bloom-beauty-dublin",
      "dundrum-hair-studio",
    ],
    upcomingDaysBySlug: {
      "dundrum-serenity-spa": 6,
      "harbour-wellness-cork": 15,
      "bloom-beauty-dublin": 22,
    },
    packageCreditSlugs: ["harbour-wellness-cork", "dundrum-serenity-spa"],
  },
];

export function getDemoEndClient(id: DemoEndClientId): DemoEndClient {
  const row = DEMO_END_CLIENTS.find((c) => c.id === id);
  if (!row) throw new Error(`Unknown demo end client: ${id}`);
  return row;
}

export function getDemoEndClientByPhone(phoneE164: string): DemoEndClient | null {
  const norm = phoneE164.replace(/\s+/g, "");
  return DEMO_END_CLIENTS.find((c) => c.phoneE164 === norm) ?? null;
}
