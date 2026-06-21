import type { BusinessVertical } from "./types";

/** Guest surface types on W5 book host (`{slug}.livia-hq.com` or `/book/{slug}`) — thick Livia, thin channels. */
export type GuestSurfaceType =
  | "storefront"
  | "liv-chat"
  | "visit"
  | "proof"
  | "consent"
  | "deposit-pay"
  | "waitlist-accept";

export type GuestSurfaceDef = {
  type: GuestSurfaceType;
  /** Route pattern relative to `/b/{slug}` */
  routePattern: string;
  tokenRequired: boolean;
  /** Policy TTL guidance (hours); enforcement in api-server. */
  defaultTtlHours: number | null;
  verticals: BusinessVertical[] | "all";
  description: string;
};

export const GUEST_SURFACE_CATALOG: GuestSurfaceDef[] = [
  {
    type: "storefront",
    routePattern: "",
    tokenRequired: false,
    defaultTtlHours: null,
    verticals: "all",
    description: "Public book + brand shell",
  },
  {
    type: "liv-chat",
    routePattern: "",
    tokenRequired: false,
    defaultTtlHours: null,
    verticals: "all",
    description: "Embedded Liv chat panel on storefront",
  },
  {
    type: "visit",
    routePattern: "/visit/:token",
    tokenRequired: true,
    defaultTtlHours: 72,
    verticals: "all",
    description: "Day-of, reschedule, feedback",
  },
  {
    type: "proof",
    routePattern: "/proof/:token",
    tokenRequired: true,
    defaultTtlHours: 168,
    verticals: ["body-art"],
    description: "Design proof approve/reject",
  },
  {
    type: "consent",
    routePattern: "/intake/:token",
    tokenRequired: true,
    defaultTtlHours: 168,
    verticals: ["medspa", "allied-health", "beauty", "body-art"],
    description: "Consent / intake signature",
  },
  {
    type: "deposit-pay",
    routePattern: "/pay/:token",
    tokenRequired: true,
    defaultTtlHours: 48,
    verticals: ["body-art", "hair", "beauty", "medspa"],
    description: "Stripe guest checkout deposit",
  },
  {
    type: "waitlist-accept",
    routePattern: "/waitlist/:token",
    tokenRequired: true,
    defaultTtlHours: 24,
    verticals: ["fitness"],
    description: "Class waitlist promotion accept",
  },
];

export function guestSurfacesForVertical(vertical: BusinessVertical): GuestSurfaceDef[] {
  return GUEST_SURFACE_CATALOG.filter(
    (s) => s.verticals === "all" || s.verticals.includes(vertical),
  );
}

export function guestSurfaceByType(type: GuestSurfaceType): GuestSurfaceDef | undefined {
  return GUEST_SURFACE_CATALOG.find((s) => s.type === type);
}

/** surfaceId prefix for support registry — e.g. `w5.visit`. */
export function guestSurfaceId(type: GuestSurfaceType): string {
  return `w5.${type}`;
}
