/**
 * Canonical demo businesses for multi-vertical E2E.
 * Must match `seedVerticalShowcaseShops` + primary hair seed (`luxe-salon-spa`).
 */
export type VerticalShop = {
  slug: string;
  vertical: string;
  /** Routes that must load (not redirect away) for this vertical */
  exclusiveRoutes: string[];
  /** Sidebar nav label overrides (href → expected text) */
  navLabels?: Record<string, string>;
};

export const VERTICAL_DEMO_SHOPS: VerticalShop[] = [
  {
    slug: "luxe-salon-spa",
    vertical: "hair",
    exclusiveRoutes: [],
    navLabels: { "/customers": "Customers" },
  },
  {
    slug: "bloom-beauty-dublin",
    vertical: "beauty",
    exclusiveRoutes: [],
  },
  {
    slug: "motion-physio-cork",
    vertical: "allied-health",
    exclusiveRoutes: ["/day-packages"],
    navLabels: { "/customers": "Patients", "/staff": "Clinicians", "/bookings": "Appointments" },
  },
  {
    slug: "clarity-medspa-dublin",
    vertical: "medspa",
    exclusiveRoutes: ["/medspa"],
    navLabels: { "/customers": "Patients", "/bookings": "Appointments" },
  },
  {
    slug: "ink-anchor-galway",
    vertical: "body-art",
    exclusiveRoutes: ["/design-proofs"],
  },
  {
    slug: "harbour-wellness-cork",
    vertical: "wellness",
    exclusiveRoutes: ["/day-packages"],
  },
  {
    slug: "paws-parlour-dublin",
    vertical: "pet-grooming",
    exclusiveRoutes: [],
    navLabels: { "/customers": "Pet parents", "/bookings": "Grooms" },
  },
  {
    slug: "peak-fitness-dublin",
    vertical: "fitness",
    exclusiveRoutes: ["/classes"],
    navLabels: { "/customers": "Members", "/bookings": "Sessions", "/staff": "Coaches" },
  },
  {
    slug: "shine-studio-belfast",
    vertical: "automotive-detailing",
    exclusiveRoutes: [],
  },
  {
    slug: "atelier-decor-dublin",
    vertical: "event-vendors",
    exclusiveRoutes: ["/event-site"],
  },
];

/** Core tenant routes every vertical must render without error copy */
export const CORE_TENANT_ROUTES = [
  "/dashboard",
  "/inbox",
  "/bookings",
  "/customers",
  "/staff",
  "/services",
  "/settings?tab=shop",
] as const;

/** Routes gated to specific verticals — hair tenant should redirect away */
export const GATED_ROUTE_SAMPLES = [
  { path: "/medspa", allowedVertical: "medspa" },
  { path: "/classes", allowedVertical: "fitness" },
  { path: "/design-proofs", allowedVertical: "body-art" },
  { path: "/day-packages", allowedVertical: "allied-health" },
  { path: "/event-site", allowedVertical: "event-vendors" },
] as const;
