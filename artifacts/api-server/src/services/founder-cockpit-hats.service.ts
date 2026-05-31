import type { ExecHatId } from "@workspace/policy";

export type { ExecHatId };

export type ExecHatPanel = {
  id: ExecHatId;
  role: string;
  mandate: string;
  status: "ok" | "watch" | "action";
  metrics: Array<{ label: string; value: string }>;
  actions: Array<{ label: string; internalPath?: string; href?: string }>;
  focus: string;
  recentWork?: Array<{
    id: string;
    summary: string;
    actor: string;
    actorLabel: string | null;
    createdAt: string;
  }>;
};

/** Minimal snapshot shape for hat panels (avoids circular imports). */
export type ExecHatSnapshotInput = {
  observability: {
    traffic: {
      bookingsToday: number;
      bookingsPending: number;
      conversationsOpen: number;
      messagesLast24h: number;
      messagesFailed24h: number;
    };
    database: { ok: boolean; latencyMs: number };
    v3?: { stuckContinuity?: number };
  };
  platformHealth: {
    version: string;
    tenantCount: number;
    inngestEnabled: boolean;
    stripeConfigured: boolean;
    clerkConfigured: boolean;
  };
  support: {
    openTotal: number;
    urgentOpen: number;
    oldestOpenHours: number | null;
  };
  production: { allRequiredOk: boolean };
  release: { betaSignupMode: string; demoEnabled: boolean };
  rollouts: { globalEnabled: Array<{ key: string }> };
};

export function buildExecHatPanels(snapshot: ExecHatSnapshotInput): ExecHatPanel[] {
  const { observability: obs, platformHealth: ph, support, production, release } = snapshot;
  const prodOk = production.allRequiredOk;
  const stripeReady = ph.stripeConfigured;
  const tenants = ph.tenantCount;

  return [
    {
      id: "ceo",
      role: "CEO",
      mandate: "Wedge proof, narrative, Gate 2",
      status: tenants > 0 ? "watch" : "action",
      metrics: [
        { label: "Live tenants", value: String(tenants) },
        { label: "Production", value: prodOk ? "healthy" : "check failed" },
        { label: "Beta signup", value: release.betaSignupMode },
        { label: "Demo on API", value: release.demoEnabled ? "yes" : "no" },
      ],
      actions: [
        { label: "North-star dashboard (doc)", href: "https://github.com/goldspire-global/livia/blob/main/docs/company/NORTH-STAR-DASHBOARD.md" },
        { label: "Founder ship lane (doc)", href: "https://github.com/goldspire-global/livia/blob/main/docs/product/FOUNDER-SHIP-LANE.md" },
      ],
      focus: "Ten design-partner shops with real weekly bookings — everything else defers.",
    },
    {
      id: "coo",
      role: "COO",
      mandate: "Ops, support SLAs, ship discipline",
      status: support.urgentOpen > 0 ? "action" : prodOk ? "ok" : "watch",
      metrics: [
        { label: "Support open", value: String(support.openTotal) },
        { label: "Urgent", value: String(support.urgentOpen) },
        {
          label: "Oldest ticket",
          value: support.oldestOpenHours === null ? "—" : `${support.oldestOpenHours}h`,
        },
        { label: "Production", value: prodOk ? "healthy" : "check failed" },
      ],
      actions: [{ label: "Support queue", internalPath: "/support" }],
      focus: "Clear urgent queue before outbound sales.",
    },
    {
      id: "cpo",
      role: "CPO",
      mandate: "Product truth, onboarding, flags",
      status: (obs.v3?.stuckContinuity ?? 0) > 0 ? "watch" : "ok",
      metrics: [
        { label: "Bookings today", value: String(obs.traffic.bookingsToday) },
        { label: "Pending bookings", value: String(obs.traffic.bookingsPending) },
        { label: "Stuck continuity", value: String(obs.v3?.stuckContinuity ?? 0) },
        { label: "Global flags on", value: String(snapshot.rollouts.globalEnabled.length) },
      ],
      actions: [
        { label: "Feature flags", internalPath: "/flags" },
        { label: "Continuity traces", internalPath: "/continuity" },
      ],
      focus: "Owner Tuesday ritual demoable on mobile — no dead marketing claims.",
    },
    {
      id: "cto",
      role: "CTO",
      mandate: "Reliability, deploys, integrations",
      status: prodOk && obs.database.ok ? "ok" : "action",
      metrics: [
        { label: "DB", value: obs.database.ok ? `${obs.database.latencyMs}ms` : "FAIL" },
        { label: "Inngest", value: ph.inngestEnabled ? "on" : "off" },
        { label: "Clerk", value: ph.clerkConfigured ? "on" : "off" },
        { label: "API", value: ph.version },
      ],
      actions: [
        { label: "Monitoring", internalPath: "/monitoring" },
        { label: "Platform health", internalPath: "/platform" },
      ],
      focus: "Merge only when CI green + production checks pass below.",
    },
    {
      id: "cs",
      role: "Customer success",
      mandate: "Tenant health, responses, Liv incidents",
      status: support.openTotal > 5 ? "watch" : "ok",
      metrics: [
        { label: "Open tickets", value: String(support.openTotal) },
        { label: "Urgent", value: String(support.urgentOpen) },
        {
          label: "Oldest open",
          value: support.oldestOpenHours === null ? "—" : `${support.oldestOpenHours}h`,
        },
        { label: "Open conversations", value: String(obs.traffic.conversationsOpen) },
        { label: "Msgs 24h (ok / fail)", value: `${obs.traffic.messagesLast24h} / ${obs.traffic.messagesFailed24h}` },
      ],
      actions: [
        { label: "Support queue", internalPath: "/support" },
        { label: "Tenant directory", internalPath: "/tenants" },
        { label: "Atlas runbooks", internalPath: "/knowledge" },
      ],
      focus: "Blocking first response <4h when partners are live.",
    },
    {
      id: "cro",
      role: "CRO",
      mandate: "Pipeline, billing readiness, commercial proof",
      status: stripeReady ? "watch" : "action",
      metrics: [
        { label: "Stripe", value: stripeReady ? "configured" : "not configured" },
        { label: "Tenants", value: String(tenants) },
        { label: "Bookings today", value: String(obs.traffic.bookingsToday) },
      ],
      actions: [
        { label: "Tenants (billing)", internalPath: "/tenants" },
        { label: "Weekly report", internalPath: "/reports" },
      ],
      focus: "First real Stripe deposit before broadening verticals.",
    },
  ];
}
