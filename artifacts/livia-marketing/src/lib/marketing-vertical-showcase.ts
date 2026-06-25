/** Marketing vertical slug → showcase assets under /showcase/verticals/{slug}/ */

export type VerticalShowcaseEntry = {
  /** Folder name under public/showcase/verticals/ */
  assetSlug: string;
  web: { label: string; caption: string };
  mobile: { label: string; caption: string; fullPage?: boolean };
};

export const VERTICAL_SHOWCASE: Record<string, VerticalShowcaseEntry> = {
  hair: {
    assetSlug: "hair",
    web: {
      label: "Inbox · web",
      caption: "Unified threads with Liv handling routine replies — take over any conversation.",
    },
    mobile: {
      label: "Today · mobile",
      caption: "Owner briefing, bookings, and what needs you — in your pocket.",
    },
  },
  barber: {
    assetSlug: "hair",
    web: {
      label: "Floor · web",
      caption: "Walk-ins and bookings on one calendar — queue and phone answered.",
    },
    mobile: {
      label: "Today · mobile",
      caption: "See the day at a glance before the first client sits down.",
    },
  },
  beauty: {
    assetSlug: "beauty",
    web: {
      label: "Bookings · web",
      caption: "Chair plan, buffers, and turnover — not a calendar that lies.",
    },
    mobile: {
      label: "Guest book · mobile",
      caption: "Branded booking link with services, team, and patch-test aware menus.",
      fullPage: true,
    },
  },
  tattoo: {
    assetSlug: "body-art",
    web: {
      label: "Design proofs · web",
      caption: "Consult-to-chair with proof status before session time.",
    },
    mobile: {
      label: "Guest book · mobile",
      caption: "Deposits and session length on your branded booking page.",
      fullPage: true,
    },
  },
  "body-art": {
    assetSlug: "body-art",
    web: {
      label: "Design proofs · web",
      caption: "Artist proofs, consult threads, and deposit policy in one place.",
    },
    mobile: {
      label: "Guest book · mobile",
      caption: "Guests book consults and sessions from your link — deposit holds the slot.",
      fullPage: true,
    },
  },
  wellness: {
    assetSlug: "wellness",
    web: {
      label: "Room board · web",
      caption: "Packages, rooms, and evening enquiry flow — calm ops rhythm.",
    },
    mobile: {
      label: "Guest book · mobile",
      caption: "Spa-native booking — treatments and gift-ready flows, not salon chrome.",
      fullPage: true,
    },
  },
  fitness: {
    assetSlug: "fitness",
    web: {
      label: "Classes · web",
      caption: "Class capacity, packs, and PT slots — one schedule.",
    },
    mobile: {
      label: "Guest book · mobile",
      caption: "Guests book classes or join the waitlist from your link.",
      fullPage: true,
    },
  },
  medspa: {
    assetSlug: "medspa",
    web: {
      label: "Clinical hub · web",
      caption: "Consent queue and intake review before treatment time.",
    },
    mobile: {
      label: "Guest book · mobile",
      caption: "Consent captured at booking — audit trail before they arrive.",
      fullPage: true,
    },
  },
  "allied-health": {
    assetSlug: "allied-health",
    web: {
      label: "Clients · web",
      caption: "Visit context and care notes — lite clinic flow, not an EHR.",
    },
    mobile: {
      label: "Guest book · mobile",
      caption: "Patients book with prep notes on your booking page.",
      fullPage: true,
    },
  },
  "pet-grooming": {
    assetSlug: "pet-grooming",
    web: {
      label: "Groom calendar · web",
      caption: "Pet profiles, breed notes, and rebook cycles on the floor plan.",
    },
    mobile: {
      label: "Guest book · mobile",
      caption: "Parents book grooms and attach pet details from your link.",
      fullPage: true,
    },
  },
  "automotive-detailing": {
    assetSlug: "automotive-detailing",
    web: {
      label: "Bay schedule · web",
      caption: "Bay time, vehicle notes, and handover queue in one view.",
    },
    mobile: {
      label: "Guest book · mobile",
      caption: "Customers pick detail packages and bay slots online.",
      fullPage: true,
    },
  },
};

export function resolveVerticalShowcase(slug: string): VerticalShowcaseEntry | null {
  return VERTICAL_SHOWCASE[slug] ?? null;
}
