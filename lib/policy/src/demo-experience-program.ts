import type { BusinessVertical } from "./types";

/**
 * Design-partner demo tracks — curated “their Tuesday morning” stories.
 * Full scripts: docs/product/DEMO-EXPERIENCE-PROGRAM.md
 * Lab / QA tenants stay on /demo advanced grid — not listed here.
 */
export type DemoPartnerTrackId =
  | "solo-shop"
  | "studio-team"
  | "multi-site-chain"
  | "quote-first";

export type DemoPartnerLoginKind =
  | "scenario-solo"
  | "scenario-studio-barber"
  | "scenario-chain"
  | "owner-slug";

export type DemoPartnerTrack = {
  id: DemoPartnerTrackId;
  title: string;
  subtitle: string;
  tagline: string;
  orgShapeLabel: string;
  slug: string;
  loginKind: DemoPartnerLoginKind;
  landingPath: string;
  /** Guest surface without sign-in */
  guestPathKind: "public-book" | "public-event";
  wedgeVertical?: BusinessVertical;
  wowMoment: string;
  /** ~10 min design-partner walkthrough */
  walkthroughSteps: string[];
  sortOrder: number;
};

export const DEMO_PARTNER_TRACKS: DemoPartnerTrack[] = [
  {
    id: "solo-shop",
    title: "Run my shop",
    subtitle: "Solo owner · one chair or home studio",
    tagline: "Your morning briefing, inbox, and bookings — no team switcher noise.",
    orgShapeLabel: "Solo",
    slug: "stoneybatter-cuts",
    loginKind: "scenario-solo",
    landingPath: "/dashboard",
    guestPathKind: "public-book",
    wedgeVertical: "hair",
    wowMoment: "Today flight plan + one Liv-handled DM waiting in inbox.",
    walkthroughSteps: [
      "Land on Today — read Liv briefing aloud.",
      "Open Inbox — one thread with Liv draft; copy or take over.",
      "Confirm a pending booking from the action queue.",
      "Hand them the phone: guest books on your booking page without signing in.",
    ],
    sortOrder: 1,
  },
  {
    id: "studio-team",
    title: "Run my studio",
    subtitle: "Owner + stylists · one busy location",
    tagline: "Multi-chair floor without chain HQ complexity.",
    orgShapeLabel: "Studio",
    slug: "dublin-barber-collective",
    loginKind: "scenario-studio-barber",
    landingPath: "/dashboard",
    guestPathKind: "public-book",
    wedgeVertical: "hair",
    wowMoment: "Team calendar + roster roles (manager/desk) when they say “I have staff.”",
    walkthroughSteps: [
      "Today — shop-wide view, not solo-chair only.",
      "Bookings — multi-staff day board.",
      "Optional: sign in as manager@ for inbox approvals (advanced).",
      "Guest path: /b/{slug} on their phone.",
    ],
    sortOrder: 2,
  },
  {
    id: "multi-site-chain",
    title: "Run my chain",
    subtitle: "Same brand · three locations",
    tagline: "Location switcher + rollup — not a 17-tenant portfolio.",
    orgShapeLabel: "Chain",
    slug: "aurora-studio",
    loginKind: "scenario-chain",
    landingPath: "/chain",
    guestPathKind: "public-book",
    wedgeVertical: "hair",
    wowMoment: "Chain glance: Mews up week-on-week, Galway inbox waiting.",
    walkthroughSteps: [
      "Land on /chain — three locations, one story.",
      "Drill into flagship inbox — realistic DM thread.",
      "Switch location in tenant switcher (Galway or Mews).",
      "Only offer org-admin@ portfolio if they ask about multi-brand.",
    ],
    sortOrder: 3,
  },
  {
    id: "quote-first",
    title: "Quote-first business",
    subtitle: "Enquiry → quote → booked",
    tagline: "Consult-first OS — not calendar-shaped. Event decor flagship.",
    orgShapeLabel: "Consult-first",
    slug: "atelier-decor-dublin",
    loginKind: "owner-slug",
    landingPath: "/dashboard",
    guestPathKind: "public-event",
    wedgeVertical: "event-vendors",
    wowMoment: "Brief intelligence → draft quote in under a minute → guest pays deposit.",
    walkthroughSteps: [
      "Today — pipeline KPIs (new / quoted / follow up).",
      "Inbox — Sarah Murphy enquiry; generate quote from brief.",
      "Send guest link; show similar work + milestone pay on /e/.../q/{token}.",
      "G3 shortcut: /e/atelier-decor-dublin/enquire on their phone.",
    ],
    sortOrder: 4,
  },
];

export function listDemoPartnerTracks(): DemoPartnerTrack[] {
  return [...DEMO_PARTNER_TRACKS].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getDemoPartnerTrack(id: string): DemoPartnerTrack | undefined {
  return DEMO_PARTNER_TRACKS.find((t) => t.id === id);
}
