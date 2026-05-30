/**
 * Support-point registry — stable surfaceId → engineering map (Track B1).
 * @see docs/operations/SUPPORT-POINTS-AND-INVESTIGATION.md
 */

export type SupportPointApp = "dashboard" | "mobile" | "public" | "internal";

export type SupportPoint = {
  surfaceId: string;
  label: string;
  owner: string;
  apps: SupportPointApp[];
  routes: string[];
  policyModules: string[];
  services: string[];
  uiComponents: string[];
  tests: string[];
  runbook?: string;
  suggestedReply?: string;
};

/** P0 catalog — expand via PR with registry + triage + this table together. */
export const SUPPORT_POINTS: SupportPoint[] = [
  {
    surfaceId: "dashboard.shell",
    label: "Dashboard shell",
    owner: "platform",
    apps: ["dashboard"],
    routes: ["*"],
    policyModules: ["lib/policy/src/tenant-experience.ts"],
    services: [],
    uiComponents: ["artifacts/livia-dashboard/src/components/layout/app-layout.tsx"],
    tests: [],
    suggestedReply: "Confirm route and business context; check tenant experience API.",
  },
  {
    surfaceId: "dashboard.home",
    label: "Owner home",
    owner: "onboarding",
    apps: ["dashboard"],
    routes: ["/", "/dashboard"],
    policyModules: ["lib/policy/src/onboarding-program.ts"],
    services: ["artifacts/api-server/src/services/onboarding-analytics.service.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/dashboard.tsx"],
    tests: [],
  },
  {
    surfaceId: "dashboard.onboarding",
    label: "Onboarding wizard",
    owner: "onboarding",
    apps: ["dashboard"],
    routes: ["/onboarding", "/onboarding-preview"],
    policyModules: ["lib/policy/src/onboarding-program.ts"],
    services: ["artifacts/api-server/src/services/onboarding.service.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/onboarding.tsx"],
    tests: ["e2e/tests/eu-owner-self-onboard.spec.ts"],
    runbook: "docs/operations/ONBOARDING-PORTAL-TEST.md",
    suggestedReply: "Check onboarding state in Settings; compare acts A1–A12 in onboarding-program.ts.",
  },
  {
    surfaceId: "dashboard.inbox",
    label: "Inbox / conversations",
    owner: "liv",
    apps: ["dashboard"],
    routes: ["/inbox"],
    policyModules: ["lib/policy/src/inbox-queue.ts"],
    services: ["artifacts/api-server/src/services/conversations.service.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/inbox.tsx"],
    tests: ["e2e/tests/ux-quality-gate.spec.ts"],
    suggestedReply: "Open thread; check Liv takeover and queue lenses.",
  },
  {
    surfaceId: "dashboard.booking.detail",
    label: "Booking detail",
    owner: "bookings",
    apps: ["dashboard"],
    routes: ["/bookings/:id"],
    policyModules: ["lib/policy/src/booking-guards.ts"],
    services: ["artifacts/api-server/src/services/bookings.service.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/booking-detail.tsx"],
    tests: [],
    suggestedReply: "Open booking detail continuity timeline; check pending queue.",
  },
  {
    surfaceId: "dashboard.settings.billing",
    label: "Settings — billing",
    owner: "billing",
    apps: ["dashboard"],
    routes: ["/settings"],
    policyModules: ["lib/entitlements/src/index.ts"],
    services: ["artifacts/api-server/src/services/billing.service.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/settings.tsx"],
    tests: [],
    suggestedReply: "Check Settings → Billing and Stripe status on tenant health card.",
  },
  {
    surfaceId: "dashboard.settings.liv",
    label: "Settings — Liv",
    owner: "liv",
    apps: ["dashboard"],
    routes: ["/settings"],
    policyModules: ["lib/policy/src/liv-mandate.ts"],
    services: [],
    uiComponents: ["artifacts/livia-dashboard/src/pages/settings.tsx"],
    tests: [],
    suggestedReply: "Settings → Liv tone and tool catalog; compare thread with Take over.",
  },
  {
    surfaceId: "public.booking",
    label: "Public book /b",
    owner: "guest",
    apps: ["public"],
    routes: ["/b/:slug"],
    policyModules: ["lib/policy/src/guest-surfaces.ts"],
    services: ["artifacts/api-server/src/routes/public.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/public-booking.tsx"],
    tests: ["e2e/tests/public-booking-quality.spec.ts", "e2e/tests/all-verticals-smoke.spec.ts"],
    suggestedReply: "Reproduce on /b/{slug}; check public API and guest token pages.",
  },
  {
    surfaceId: "public.visit",
    label: "Guest visit token",
    owner: "guest",
    apps: ["public"],
    routes: ["/b/:slug/visit/:token"],
    policyModules: ["lib/policy/src/guest-surfaces.ts"],
    services: ["artifacts/api-server/src/services/booking-guest-access.service.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/public-visit.tsx"],
    tests: ["e2e/tests/all-verticals-smoke.spec.ts"],
  },
  {
    surfaceId: "public.intake",
    label: "Guest medical intake",
    owner: "guest",
    apps: ["public"],
    routes: ["/b/:slug/intake/:token"],
    policyModules: ["lib/policy/src/guest-surfaces.ts"],
    services: ["artifacts/api-server/src/services/medical-intake-guest-access.service.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/public-intake.tsx"],
    tests: [],
    suggestedReply: "Open intake token URL; check medical_intake_records status.",
  },
  {
    surfaceId: "public.waitlist",
    label: "Class waitlist accept",
    owner: "guest",
    apps: ["public"],
    routes: ["/b/:slug/waitlist/:token"],
    policyModules: ["lib/policy/src/guest-surfaces.ts"],
    services: ["artifacts/api-server/src/services/waitlist-guest-access.service.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/public-waitlist.tsx"],
    tests: [],
    suggestedReply: "Confirm offer_token on slot_waitlist_entries and cancelled slot still open.",
  },
  {
    surfaceId: "public.proof",
    label: "Body-art proof",
    owner: "guest",
    apps: ["public"],
    routes: ["/b/:slug/proof/:token"],
    policyModules: ["lib/policy/src/guest-surfaces.ts"],
    services: ["artifacts/api-server/src/services/design-proofs.service.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/public-proof.tsx"],
    tests: [],
  },
  {
    surfaceId: "internal.support.queue",
    label: "Support thread queue",
    owner: "support",
    apps: ["internal"],
    routes: ["/support", "/support/queue"],
    policyModules: ["lib/policy/src/support-points.ts"],
    services: ["artifacts/api-server/src/services/internal-support-tickets.service.ts"],
    uiComponents: ["artifacts/livia-internal/src/views/SupportQueueView.tsx"],
    tests: ["e2e/tests/internal-ops-smoke.spec.ts"],
    runbook: "docs/operations/support-runbook.md",
  },
  {
    surfaceId: "internal.support.investigate",
    label: "Support investigate",
    owner: "support",
    apps: ["internal"],
    routes: ["/support/investigate"],
    policyModules: ["lib/policy/src/support-points.ts"],
    services: [],
    uiComponents: ["artifacts/livia-internal/src/views/SupportInvestigateView.tsx"],
    tests: [],
  },
];

const BY_ID = new Map(SUPPORT_POINTS.map((p) => [p.surfaceId, p]));

export function listSupportPoints(): SupportPoint[] {
  return [...SUPPORT_POINTS];
}

export function getSupportPoint(surfaceId: string): SupportPoint | undefined {
  return BY_ID.get(surfaceId);
}

/** Resolve stable surfaceId from dashboard pathname (+ optional search for onboarding intent). */
export function resolveSupportSurfaceId(pathname: string, search = ""): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  if (path === "/" || path === "/dashboard") return "dashboard.home";
  if (path.startsWith("/onboarding")) return "dashboard.onboarding";
  if (path === "/inbox") return "dashboard.inbox";
  if (/^\/bookings\/[^/]+$/.test(path)) return "dashboard.booking.detail";
  if (path === "/bookings/new") return "dashboard.bookings.new";
  if (path.startsWith("/settings")) {
    const tab = params.get("tab");
    if (tab === "billing") return "dashboard.settings.billing";
    if (tab === "liv") return "dashboard.settings.liv";
    if (tab === "comms") return "dashboard.settings.comms";
    if (tab === "shop" || tab === "policy") return "dashboard.settings.shop";
    return "dashboard.settings.shop";
  }
  if (path.startsWith("/b/") && path.includes("/intake/")) return "public.intake";
  if (path.startsWith("/b/") && path.includes("/waitlist/")) return "public.waitlist";
  if (path.startsWith("/b/") && path.includes("/visit/")) return "public.visit";
  if (path.startsWith("/b/") && path.includes("/proof/")) return "public.proof";
  if (path.startsWith("/b/")) return "public.booking";
  if (path.startsWith("/support/investigate")) return "internal.support.investigate";
  if (path.startsWith("/support")) return "internal.support.queue";
  return "dashboard.shell";
}
