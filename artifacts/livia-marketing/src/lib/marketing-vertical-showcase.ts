/** Marketing vertical slug → showcase assets under /showcase/verticals/{slug}/ */

export type VerticalShowcaseEntry = {
  /** Folder name under public/showcase/verticals/ */
  assetSlug: string;
  web: { label: string; caption: string };
  mobile: {
    label: string;
    caption: string;
    /** Public /b capture — no owner Today greeting overlay */
    fullPage?: boolean;
    /** Masks demo Clerk name on owner Today captures */
    greeting?: string;
  };
};

export const VERTICAL_SHOWCASE: Record<string, VerticalShowcaseEntry> = {
  hair: {
    assetSlug: "hair",
    web: {
      label: "Inbox · web · Warm Chair",
      caption: "Unified threads with Liv handling routine replies — Warm Chair owner shell, not generic SaaS.",
    },
    mobile: {
      label: "Guest book · mobile · Warm Chair",
      caption: "Guest booking on Warm Chair — golden salon skin, not generic SaaS chrome.",
      fullPage: true,
    },
  },
  barber: {
    assetSlug: "hair",
    web: {
      label: "Floor · web",
      caption: "Walk-ins and bookings on one calendar — queue and phone answered.",
    },
    mobile: {
      label: "Guest book · mobile · Warm Chair",
      caption: "Branded guest link on Warm Chair — walk-ins and bookings from one skin.",
      fullPage: true,
    },
  },
  beauty: {
    assetSlug: "beauty",
    web: {
      label: "Bookings · web · Noir Dusk",
      caption: "Evening-studio chair plan on Noir Dusk — buffers and turnover, not a calendar that lies.",
    },
    mobile: {
      label: "Guest book · mobile · Noir Dusk",
      caption: "Evening-studio guest link on the Noir Dusk preset — branded, not a template.",
      fullPage: true,
    },
  },
  tattoo: {
    assetSlug: "body-art",
    web: {
      label: "Design proofs · web · Studio Dark",
      caption: "Consult-to-chair with proof status before session time — Studio Dark desk.",
    },
    mobile: {
      label: "Guest book · mobile · Studio Dark",
      caption: "Deposits and session length on your branded booking page.",
      fullPage: true,
    },
  },
  "body-art": {
    assetSlug: "body-art",
    web: {
      label: "Design proofs · web · Studio Dark",
      caption: "Studio Dark proof desk — artist sign-off, consult threads, and deposit policy in one place.",
    },
    mobile: {
      label: "Guest book · mobile · Studio Dark",
      caption: "Guests book consults and sessions from your link — deposit holds the slot.",
      fullPage: true,
    },
  },
  wellness: {
    assetSlug: "wellness",
    web: {
      label: "Room board · web · Harbour Light",
      caption: "Harbour Light room board — packages, rooms, and calm evening enquiry flow.",
    },
    mobile: {
      label: "Guest book · mobile · Harbour Light",
      caption: "Spa-native booking on Harbour Light — gift-ready tiles, not salon chrome.",
      fullPage: true,
    },
  },
  fitness: {
    assetSlug: "fitness",
    web: {
      label: "Classes · web · Gym Bold",
      caption: "Gym Bold class roster — capacity, waitlist, and PT slots on one schedule.",
    },
    mobile: {
      label: "Guest book · mobile · Gym Bold",
      caption: "Guests book classes or join the waitlist from your link.",
      fullPage: true,
    },
  },
  medspa: {
    assetSlug: "medspa",
    web: {
      label: "Clinical hub · web · Clinical Calm",
      caption: "Clinical Calm consent queue — intake review before treatment time.",
    },
    mobile: {
      label: "Guest book · mobile · Clinical Calm",
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
