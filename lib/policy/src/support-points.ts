/**
 * Support-point registry — stable surfaceId → engineering map (Track B1).
 * @see docs/operations/SUPPORT-POINTS-AND-INVESTIGATION.md
 */

import {
  canonicalSurfaceId,
  resolvePlatformSurfaceId,
} from "./platform-surface-registry";

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
    surfaceId: "tenant.owner.dashboard",
    label: "Owner home",
    owner: "onboarding",
    apps: ["dashboard"],
    routes: ["/", "/dashboard"],
    policyModules: ["lib/policy/src/onboarding-program.ts", "lib/policy/src/tenant-experience.ts"],
    services: ["artifacts/api-server/src/services/onboarding-analytics.service.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/dashboard.tsx"],
    tests: [],
  },
  {
    surfaceId: "gateway.onboarding",
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
    surfaceId: "tenant.inbox",
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
    surfaceId: "tenant.bookings.list",
    label: "Bookings calendar",
    owner: "bookings",
    apps: ["dashboard"],
    routes: ["/bookings"],
    policyModules: ["lib/policy/src/booking-guards.ts"],
    services: ["artifacts/api-server/src/services/bookings.service.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/bookings.tsx"],
    tests: [],
  },
  {
    surfaceId: "tenant.booking.new",
    label: "New booking wizard",
    owner: "bookings",
    apps: ["dashboard"],
    routes: ["/bookings/new"],
    policyModules: ["lib/policy/src/booking-guards.ts"],
    services: ["artifacts/api-server/src/services/bookings.service.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/booking-new.tsx"],
    tests: [],
  },
  {
    surfaceId: "tenant.settings",
    label: "Tenant settings",
    owner: "platform",
    apps: ["dashboard"],
    routes: ["/settings"],
    policyModules: ["lib/policy/src/tenant-experience.ts", "lib/policy/src/presentation-presets.ts"],
    services: [],
    uiComponents: ["artifacts/livia-dashboard/src/pages/settings.tsx"],
    tests: [],
    suggestedReply: "Check Settings tabs; verify /b preview on Public appearance.",
  },
  {
    surfaceId: "tenant.founder.chain",
    label: "Multi-shop chain view",
    owner: "platform",
    apps: ["dashboard"],
    routes: ["/chain"],
    policyModules: ["lib/policy/src/org-shape.ts"],
    services: [],
    uiComponents: ["artifacts/livia-dashboard/src/pages/chain.tsx"],
    tests: [],
  },
  {
    surfaceId: "tenant.medspa.hub",
    label: "Medspa clinical hub",
    owner: "medspa",
    apps: ["dashboard"],
    routes: ["/medspa"],
    policyModules: ["lib/policy/src/medspa-procedures.ts"],
    services: [],
    uiComponents: ["artifacts/livia-dashboard/src/pages/medspa-hub.tsx"],
    tests: [],
  },
  {
    surfaceId: "tenant.design-proofs",
    label: "Design proofs",
    owner: "body-art",
    apps: ["dashboard"],
    routes: ["/design-proofs"],
    policyModules: ["lib/policy/src/guest-surfaces.ts"],
    services: ["artifacts/api-server/src/services/design-proofs.service.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/design-proofs.tsx"],
    tests: [],
  },
  {
    surfaceId: "tenant.staff.my-day",
    label: "Staff my day",
    owner: "bookings",
    apps: ["dashboard"],
    routes: ["/my-day"],
    policyModules: [],
    services: ["artifacts/api-server/src/routes/my-day.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/my-day.tsx"],
    tests: [],
  },
  {
    surfaceId: "gateway.sign-in",
    label: "Sign in",
    owner: "platform",
    apps: ["dashboard"],
    routes: ["/sign-in"],
    policyModules: [],
    services: [],
    uiComponents: ["artifacts/livia-dashboard/src/pages/sign-in.tsx"],
    tests: [],
  },
  {
    surfaceId: "gateway.legal-accept",
    label: "Legal acceptance gate",
    owner: "platform",
    apps: ["dashboard"],
    routes: ["/legal-acceptance"],
    policyModules: ["lib/policy/src/platform-legal.ts"],
    services: [],
    uiComponents: ["artifacts/livia-dashboard/src/pages/legal-acceptance.tsx"],
    tests: [],
  },
  {
    surfaceId: "gateway.demo.launcher",
    label: "Demo launcher",
    owner: "gtm",
    apps: ["dashboard"],
    routes: ["/demo"],
    policyModules: ["lib/policy/src/wedge-demo-stories.ts"],
    services: ["artifacts/api-server/src/routes/demo.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/demo/Launcher.tsx"],
    tests: ["e2e/tests/full-platform-demo.spec.ts"],
  },
  {
    surfaceId: "gateway.demo.wedge",
    label: "Demo wedge story",
    owner: "gtm",
    apps: ["dashboard"],
    routes: ["/demo/wedge/:vertical"],
    policyModules: ["lib/policy/src/wedge-demo-stories.ts"],
    services: [],
    uiComponents: ["artifacts/livia-dashboard/src/pages/demo/WedgeStory.tsx"],
    tests: ["e2e/tests/full-platform-demo.spec.ts"],
  },
  {
    surfaceId: "tenant.booking.detail",
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
    surfaceId: "guest.public.book",
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
    surfaceId: "public.deposit-pay",
    label: "Guest deposit pay",
    owner: "guest",
    apps: ["public"],
    routes: ["/b/:slug/pay/:token"],
    policyModules: ["lib/policy/src/guest-surfaces.ts"],
    services: ["artifacts/api-server/src/routes/public.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/public-pay.tsx"],
    tests: [],
    suggestedReply: "Open pay token URL; check Stripe element and deposit amount.",
  },
  {
    surfaceId: "guest.public.proof",
    label: "Body-art proof",
    owner: "guest",
    apps: ["public"],
    routes: ["/b/:slug/proof/:token"],
    policyModules: ["lib/policy/src/guest-surfaces.ts"],
    services: ["artifacts/api-server/src/services/design-proofs.service.ts"],
    uiComponents: ["artifacts/livia-dashboard/src/pages/public-proof.tsx"],
    tests: ["e2e/tests/demo-proof-token.spec.ts"],
  },
  {
    surfaceId: "guest.public.hub",
    label: "My Livia guest hub",
    owner: "guest",
    apps: ["public"],
    routes: ["/my"],
    policyModules: ["lib/policy/src/guest-surfaces.ts"],
    services: ["artifacts/api-server/src/services/guest-hub.service.ts"],
    uiComponents: [
      "artifacts/livia-dashboard/src/pages/my-livia.tsx",
      "artifacts/livia-dashboard/src/components/guest/guest-hub-chrome.tsx",
    ],
    tests: [],
    suggestedReply: "Verify phone OTP on /my; check guest-hub token and shop links API.",
  },
  {
    surfaceId: "internal.support.thread",
    label: "Support thread",
    owner: "support",
    apps: ["internal"],
    routes: ["/support", "/support/queue", "/support/investigate"],
    policyModules: ["lib/policy/src/support-points.ts"],
    services: ["artifacts/api-server/src/services/internal-support-tickets.service.ts"],
    uiComponents: [
      "artifacts/livia-internal/src/views/SupportQueueView.tsx",
      "artifacts/livia-internal/src/views/SupportInvestigateView.tsx",
    ],
    tests: ["e2e/tests/internal-ops-smoke.spec.ts"],
    runbook: "docs/operations/support-runbook.md",
    suggestedReply: "Open thread context pane; match surfaceId to registry and Liv tool matrix.",
  },
];

const BY_ID = new Map(SUPPORT_POINTS.map((p) => [p.surfaceId, p]));

export function listSupportPoints(): SupportPoint[] {
  return [...SUPPORT_POINTS];
}

export function getSupportPoint(surfaceId: string): SupportPoint | undefined {
  return BY_ID.get(canonicalSurfaceId(surfaceId));
}

/** Resolve stable surfaceId from dashboard pathname — canonical P0 ids from screen cards. */
export function resolveSupportSurfaceId(pathname: string, search = ""): string {
  return resolvePlatformSurfaceId(pathname, search);
}
