/**
 * P0 platform surface registry — screen card ↔ route ↔ OpenAPI traceability (Phase 0).
 * @see docs/design/screen-cards/ · docs/product/LIVIA-BUILD-PLAN-V2.md §2 Phase 0
 */

export type PlatformSurfaceApp = "dashboard" | "mobile" | "marketing" | "internal" | "public";

export type PlatformSurfaceDef = {
  surfaceId: string;
  screenCardId: string;
  world: string;
  routes: string[];
  app: PlatformSurfaceApp;
  openapiPaths?: string[];
};

/** P0 — 24 screen cards from FIGMA-SCREEN-MANIFEST §3. */
export const P0_PLATFORM_SURFACES: PlatformSurfaceDef[] = [
  {
    surfaceId: "guest.public.book",
    screenCardId: "w5.public.book.mobile",
    world: "W5",
    routes: ["/b/:slug"],
    app: "public",
    openapiPaths: ["/public/b/{slug}", "/public/b/{slug}/book", "/public/b/{slug}/slots"],
  },
  {
    surfaceId: "guest.public.proof",
    screenCardId: "w5.public.proof.mobile",
    world: "W5",
    routes: ["/b/:slug/proof/:token"],
    app: "public",
  },
  {
    surfaceId: "public.visit",
    screenCardId: "w5.public.visit.mobile",
    world: "W5",
    routes: ["/b/:slug/visit/:token"],
    app: "public",
  },
  {
    surfaceId: "public.intake",
    screenCardId: "w5.public.intake.mobile",
    world: "W5",
    routes: ["/b/:slug/intake/:token"],
    app: "public",
  },
  {
    surfaceId: "public.deposit-pay",
    screenCardId: "w5.public.pay.mobile",
    world: "W5",
    routes: ["/b/:slug/pay/:token"],
    app: "public",
  },
  {
    surfaceId: "guest.public.hub",
    screenCardId: "w6.guest.hub.web",
    world: "W6",
    routes: ["/my"],
    app: "public",
    openapiPaths: ["/public/guest-hub/me", "/public/guest-hub/otp/request"],
  },
  {
    surfaceId: "tenant.staff.my-day",
    screenCardId: "w4.staff.my-day.mobile",
    world: "W4",
    routes: ["/my-day"],
    app: "dashboard",
    openapiPaths: ["/businesses/{businessId}/my-day"],
  },
  {
    surfaceId: "tenant.owner.dashboard",
    screenCardId: "w4.owner.dashboard.web",
    world: "W4",
    routes: ["/", "/dashboard"],
    app: "dashboard",
    openapiPaths: ["/businesses/{businessId}/dashboard"],
  },
  {
    surfaceId: "tenant.founder.chain",
    screenCardId: "w4.owner.chain.web",
    world: "W4",
    routes: ["/chain"],
    app: "dashboard",
  },
  {
    surfaceId: "tenant.inbox",
    screenCardId: "w4.ops.inbox.web",
    world: "W4",
    routes: ["/inbox"],
    app: "dashboard",
    openapiPaths: ["/businesses/{businessId}/conversations"],
  },
  {
    surfaceId: "tenant.settings",
    screenCardId: "w4.ops.settings.web",
    world: "W4",
    routes: ["/settings"],
    app: "dashboard",
  },
  {
    surfaceId: "tenant.bookings.list",
    screenCardId: "w4.ops.bookings.list.web",
    world: "W4",
    routes: ["/bookings"],
    app: "dashboard",
    openapiPaths: ["/businesses/{businessId}/bookings"],
  },
  {
    surfaceId: "tenant.booking.new",
    screenCardId: "w4.ops.bookings.new.web",
    world: "W4",
    routes: ["/bookings/new"],
    app: "dashboard",
    openapiPaths: ["/businesses/{businessId}/bookings"],
  },
  {
    surfaceId: "tenant.design-proofs",
    screenCardId: "w4.ops.design-proofs.web",
    world: "W4",
    routes: ["/design-proofs"],
    app: "dashboard",
  },
  {
    surfaceId: "tenant.medspa.hub",
    screenCardId: "w4.ops.medspa.hub.web",
    world: "W4",
    routes: ["/medspa"],
    app: "dashboard",
  },
  {
    surfaceId: "tenant.notifications",
    screenCardId: "w4m.notifications.mobile",
    world: "W4",
    routes: [],
    app: "mobile",
  },
  {
    surfaceId: "tenant.founder.shops.mobile",
    screenCardId: "w4m.founder.shops.mobile",
    world: "W4",
    routes: [],
    app: "mobile",
  },
  {
    surfaceId: "gateway.sign-in",
    screenCardId: "w2.gateway.sign-in.web",
    world: "W2",
    routes: ["/sign-in"],
    app: "dashboard",
  },
  {
    surfaceId: "gateway.onboarding",
    screenCardId: "w2.gateway.onboarding.web",
    world: "W2",
    routes: ["/onboarding", "/onboarding-preview"],
    app: "dashboard",
    openapiPaths: ["/onboarding/catalog", "/onboarding/preview"],
  },
  {
    surfaceId: "gateway.legal-accept",
    screenCardId: "w2.gateway.legal-accept.web",
    world: "W2",
    routes: ["/legal-acceptance"],
    app: "dashboard",
  },
  {
    surfaceId: "gateway.demo.launcher",
    screenCardId: "w2.gateway.demo.launcher.web",
    world: "W2",
    routes: ["/demo"],
    app: "dashboard",
  },
  {
    surfaceId: "gateway.demo.wedge",
    screenCardId: "w2.gateway.demo.wedge.web",
    world: "W2",
    routes: ["/demo/wedge/:vertical"],
    app: "dashboard",
  },
  {
    surfaceId: "marketing.home",
    screenCardId: "w1.marketing.home.web",
    world: "W1",
    routes: [],
    app: "marketing",
    openapiPaths: ["/public/marketing/leads"],
  },
  {
    surfaceId: "marketing.pricing",
    screenCardId: "w1.marketing.pricing.web",
    world: "W1",
    routes: [],
    app: "marketing",
  },
  {
    surfaceId: "internal.support.thread",
    screenCardId: "w3.support.thread.web",
    world: "W3",
    routes: ["/support", "/support/tickets/:id"],
    app: "internal",
  },
];

const BY_SURFACE_ID = new Map(P0_PLATFORM_SURFACES.map((s) => [s.surfaceId, s]));
const BY_SCREEN_CARD = new Map(P0_PLATFORM_SURFACES.map((s) => [s.screenCardId, s]));

/** Legacy support ticket surfaceIds → canonical P0 surfaceId. */
export const LEGACY_SURFACE_ALIASES: Record<string, string> = {
  "dashboard.shell": "tenant.owner.dashboard",
  "dashboard.home": "tenant.owner.dashboard",
  "dashboard.onboarding": "gateway.onboarding",
  "dashboard.inbox": "tenant.inbox",
  "dashboard.booking.detail": "tenant.booking.detail",
  "dashboard.bookings.new": "tenant.booking.new",
  "dashboard.settings.billing": "tenant.settings",
  "dashboard.settings.liv": "tenant.settings",
  "dashboard.settings.comms": "tenant.settings",
  "dashboard.settings.shop": "tenant.settings",
  "public.booking": "guest.public.book",
  "public.proof": "guest.public.proof",
  "internal.support.queue": "internal.support.thread",
  "internal.support.investigate": "internal.support.thread",
};

export function canonicalSurfaceId(surfaceId: string): string {
  return LEGACY_SURFACE_ALIASES[surfaceId] ?? surfaceId;
}

export function getPlatformSurface(surfaceId: string): PlatformSurfaceDef | undefined {
  return BY_SURFACE_ID.get(canonicalSurfaceId(surfaceId));
}

export function getPlatformSurfaceByScreenCard(screenCardId: string): PlatformSurfaceDef | undefined {
  return BY_SCREEN_CARD.get(screenCardId);
}

export function listPlatformSurfaces(): PlatformSurfaceDef[] {
  return [...P0_PLATFORM_SURFACES];
}

function routeMatches(pattern: string, path: string): boolean {
  const patParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patParts.length !== pathParts.length) return false;
  return patParts.every((part, i) => part.startsWith(":") || part === pathParts[i]);
}

/** Resolve canonical surfaceId from dashboard/internal pathname. */
export function resolvePlatformSurfaceId(pathname: string, search = ""): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  if (path.startsWith("/b/") && path.includes("/pay/")) return "public.deposit-pay";
  if (path.startsWith("/b/") && path.includes("/intake/")) return "public.intake";
  if (path.startsWith("/b/") && path.includes("/waitlist/")) return "public.visit";
  if (path.startsWith("/b/") && path.includes("/visit/")) return "public.visit";
  if (path.startsWith("/b/") && path.includes("/proof/")) return "guest.public.proof";
  if (path.startsWith("/b/")) return "guest.public.book";

  if (path === "/my" || path.startsWith("/my/")) return "guest.public.hub";

  if (path.startsWith("/support/investigate")) return "internal.support.thread";
  if (path.startsWith("/support")) return "internal.support.thread";

  if (/^\/bookings\/[^/]+$/.test(path) && path !== "/bookings/new") {
    return "tenant.booking.detail";
  }

  for (const surface of P0_PLATFORM_SURFACES) {
    for (const route of surface.routes) {
      if (routeMatches(route, path)) {
        if (surface.surfaceId === "tenant.settings" && params.get("tab")) {
          return "tenant.settings";
        }
        return surface.surfaceId;
      }
    }
  }

  return "tenant.owner.dashboard";
}
