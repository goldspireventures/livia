/**
 * Livia platform — final & north-star screen catalog (2026-05-29)
 * Gallery: /experience/platform-surfaces (dev only)
 * @see docs/design/PLATFORM-SURFACES-FINAL-CATALOG.md
 */

export type FinalScreenGroup =
  | "marketing"
  | "gateway"
  | "tenant-public"
  | "tenant-app"
  | "internal-exec"
  | "internal-support";

export type ScreenStatus = "locked" | "north-star" | "alternate";

export interface ScreenVariant {
  id: string;
  label: string;
  imageFile: string;
}

export interface FinalScreen {
  id: string;
  group: FinalScreenGroup;
  name: string;
  tagline: string;
  imageFile: string;
  docSection: string;
  status: ScreenStatus;
  variants?: ScreenVariant[];
}

export const FINAL_SCREEN_GROUPS: { id: FinalScreenGroup; label: string }[] = [
  { id: "marketing", label: "Marketing — livia-hq.com" },
  { id: "gateway", label: "Gateway — demo & sign-in" },
  { id: "tenant-public", label: "Tenant — public guest (P7)" },
  { id: "tenant-app", label: "Tenant — dashboard & mobile (W4)" },
  { id: "internal-exec", label: "Internal — platform exec" },
  { id: "internal-support", label: "Internal — support workspace" },
];

/** Approved + north-star visuals only. Alternates = morph layouts, not competing themes. */
export const FINAL_PLATFORM_SCREENS: FinalScreen[] = [
  // —— Marketing ——
  {
    id: "m0-shell",
    group: "marketing",
    name: "Global shell (nav + footer)",
    tagline: "Aurora editorial — inherits all marketing pages",
    imageFile: "final-marketing-m0-shell.png",
    docSection: "M0",
    status: "locked",
  },
  {
    id: "m1-home",
    group: "marketing",
    name: "Home — Constellation",
    tagline: "One OS · every people-business — orbital category story",
    imageFile: "marketing-home-m4-constellation.png",
    docSection: "M4",
    status: "locked",
  },
  {
    id: "m2-pricing",
    group: "marketing",
    name: "Pricing — honest tier cards",
    tagline: "Glass cards · € · no Most Popular badge",
    imageFile: "marketing-pricing-a-aurora-honest.png",
    docSection: "M2-A",
    status: "locked",
  },
  {
    id: "m3-how",
    group: "marketing",
    name: "How it works",
    tagline: "Continuity journey — inherits M1 story beat",
    imageFile: "final-marketing-m3-how-it-works.png",
    docSection: "M3",
    status: "north-star",
  },
  {
    id: "m4-verticals",
    group: "marketing",
    name: "Vertical index",
    tagline: "Trade worlds → demo wedge deep links",
    imageFile: "final-marketing-m4-verticals.png",
    docSection: "M4",
    status: "north-star",
  },
  // —— Gateway ——
  {
    id: "g1-wedge-grid",
    group: "gateway",
    name: "Demo — wedge grid",
    tagline: "Pick trade first",
    imageFile: "gateway-demo-a-wedge-story-grid.png",
    docSection: "G1-A",
    status: "locked",
    variants: [
      { id: "tattoo", label: "Body-art wedge story", imageFile: "gateway-demo-a-wedge-story-tattoo.png" },
      { id: "hair", label: "Hair wedge story", imageFile: "gateway-demo-c-continuity-hair.png" },
    ],
  },
  {
    id: "g3-sign-in",
    group: "gateway",
    name: "Sign-in",
    tagline: "Gateway aurora — inherits marketing",
    imageFile: "final-gateway-g3-sign-in.png",
    docSection: "G3",
    status: "north-star",
  },
  // —— Tenant public (P7 guest) ——
  {
    id: "p7-book",
    group: "tenant-public",
    name: "Public booking `/b/{slug}`",
    tagline: "Vertical skin · business brand · Liv chat",
    imageFile: "final-public-b-book.png",
    docSection: "W5-book",
    status: "north-star",
  },
  {
    id: "p7-visit",
    group: "tenant-public",
    name: "Guest visit token",
    tagline: "Day-of · running late · no login",
    imageFile: "final-public-guest-visit.png",
    docSection: "W5-visit",
    status: "north-star",
  },
  {
    id: "p7-proof",
    group: "tenant-public",
    name: "Guest design proof (body-art)",
    tagline: "Thick collab on Livia — SMS sends link only",
    imageFile: "final-public-guest-proof.png",
    docSection: "G1-proof",
    status: "north-star",
  },
  // —— Tenant app ——
  {
    id: "w4-inbox",
    group: "tenant-app",
    name: "Dashboard — Inbox",
    tagline: "Platform Default preset · continuity thread",
    imageFile: "final-tenant-dashboard-inbox.png",
    docSection: "W4-inbox",
    status: "north-star",
  },
  {
    id: "w4-proofs",
    group: "tenant-app",
    name: "Dashboard — Design proofs",
    tagline: "Body-art pipeline · pairs with guest proof page",
    imageFile: "final-tenant-dashboard-proofs.png",
    docSection: "W4-proofs",
    status: "north-star",
  },
  {
    id: "w4-mobile-today",
    group: "tenant-app",
    name: "Mobile — Staff Today",
    tagline: "Platform Default · surface morph phone",
    imageFile: "final-tenant-mobile-today.png",
    docSection: "W4-mobile",
    status: "north-star",
  },
  // —— Internal exec ——
  {
    id: "i2-shiplane",
    group: "internal-exec",
    name: "Ship Lane",
    tagline: "Collapsed summary ↔ expanded detail — same skin",
    imageFile: "internal-exec-shiplane-collapsed.png",
    docSection: "I2",
    status: "locked",
    variants: [
      { id: "expanded", label: "Expanded detail", imageFile: "internal-exec-shiplane-expanded.png" },
      { id: "hats", label: "Hats River", imageFile: "internal-exec-c-hats-river.png" },
      { id: "exceptions", label: "Exceptions tab", imageFile: "internal-exec-tabbed-exceptions.png" },
    ],
  },
  // —— Internal support ——
  {
    id: "i4-thread",
    group: "internal-support",
    name: "Support — The Thread",
    tagline: "Primary layout · queue | thread | context",
    imageFile: "internal-support-a-the-thread.png",
    docSection: "I4-A",
    status: "locked",
    variants: [
      { id: "queue", label: "Queue focus", imageFile: "internal-support-a-tab-queue.png" },
      { id: "thread", label: "Thread focus", imageFile: "internal-support-a-tab-thread.png" },
      { id: "context", label: "Context pane", imageFile: "internal-support-a-tab-context.png" },
    ],
  },
  {
    id: "i4-board",
    group: "internal-support",
    name: "Support — Triage board",
    tagline: "Alternate route `/support/board`",
    imageFile: "internal-support-b-kanban-overview.png",
    docSection: "I4-B",
    status: "alternate",
    variants: [
      { id: "detail", label: "Card detail", imageFile: "internal-support-b-kanban-card-detail.png" },
    ],
  },
  {
    id: "i4-radar",
    group: "internal-support",
    name: "Support — Tenant radar",
    tagline: "Alternate route `/support/radar`",
    imageFile: "internal-support-c-radar-grid.png",
    docSection: "I4-C",
    status: "alternate",
    variants: [
      { id: "drill", label: "Tenant drill-down", imageFile: "internal-support-c-radar-tenant-drill.png" },
      { id: "peek", label: "Ticket peek", imageFile: "internal-support-c-radar-ticket-peek.png" },
    ],
  },
  {
    id: "i4-investigate",
    group: "internal-support",
    name: "Support — Investigate",
    tagline: "Paste requestId · registry paths",
    imageFile: "final-internal-support-investigate.png",
    docSection: "I5",
    status: "north-star",
  },
];

export function screensForGroup(group: FinalScreenGroup): FinalScreen[] {
  return FINAL_PLATFORM_SCREENS.filter((s) => s.group === group);
}

export function allImagesForScreen(screen: FinalScreen): ScreenVariant[] {
  const seen = new Set<string>();
  const out: ScreenVariant[] = [];
  const push = (v: ScreenVariant) => {
    if (seen.has(v.imageFile)) return;
    seen.add(v.imageFile);
    out.push(v);
  };
  push({ id: "main", label: "Main", imageFile: screen.imageFile });
  for (const v of screen.variants ?? []) push(v);
  return out;
}

/** @deprecated use FINAL_PLATFORM_SCREENS — kept for any stale imports */
export const PLATFORM_SURFACE_GROUPS = FINAL_SCREEN_GROUPS.map((g) => ({
  id: g.id as string,
  label: g.label,
}));
export const PLATFORM_SURFACE_CONCEPTS = FINAL_PLATFORM_SCREENS;
export type PlatformSurfaceGroup = FinalScreenGroup;
export type PlatformSurfaceConcept = FinalScreen & { letter?: string; selection?: string };
export type ConceptVariant = ScreenVariant;
export function conceptsForGroup(group: FinalScreenGroup) {
  return screensForGroup(group);
}
export function allImagesForConcept(c: FinalScreen) {
  return allImagesForScreen(c);
}
