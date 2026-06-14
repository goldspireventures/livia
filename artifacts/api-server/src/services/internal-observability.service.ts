import {
  db,
  businessesTable,
  bookingsTable,
  notificationLogsTable,
  usersTable,
  conversationsTable,
  supportTicketsTable,
} from "@workspace/db";
import { sql, eq, and, gte, desc, inArray } from "drizzle-orm";
import { isLegalGateSkipped } from "../lib/platform-legal-gate";
import { getInternalPlatformHealth } from "./internal-platform.service";
import { DEMO_WORLD_SLUGS, DEMO_PERSONAS } from "../lib/demo-portal-config";
import {
  ensureDemoIdentitiesForAllAccounts,
  getDemoPortalStatus,
  markDemoBusinessesOnboardingComplete,
} from "./demo-portal.service";
import { seedDemoSupportTickets } from "./demo-support-tickets.seed";
import { listAllSupportTicketsOpen } from "./support-tickets.service";

export type ObservabilityProbe = {
  name: string;
  ok: boolean;
  status?: number;
  durationMs: number;
  detail?: string;
};

export type PlatformObservability = Awaited<ReturnType<typeof getPlatformObservability>>;

/** Deep operator snapshot — breadth (integrations), depth (DB/workflows), width (tenant traffic). */
export async function getPlatformObservability() {
  const started = Date.now();
  const health = await getInternalPlatformHealth();

  const dbStarted = Date.now();
  let dbOk = true;
  let dbLatencyMs = 0;
  try {
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - dbStarted;
  } catch (err) {
    dbOk = false;
    dbLatencyMs = Date.now() - dbStarted;
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    bookingStats,
    messageStats,
    conversationStats,
    demoTenantCount,
    usersMissingLegal,
    recentFailedMessages,
    supportTicketsOpen,
  ] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where ${bookingsTable.status} = 'PENDING')::int`,
        today: sql<number>`count(*) filter (where ${bookingsTable.startAt} >= date_trunc('day', now()))::int`,
      })
      .from(bookingsTable),
    db
      .select({
        last24h: sql<number>`count(*) filter (where ${notificationLogsTable.createdAt} >= ${dayAgo})::int`,
        failed24h: sql<number>`count(*) filter (where ${notificationLogsTable.createdAt} >= ${dayAgo} and ${notificationLogsTable.status} = 'FAILED')::int`,
      })
      .from(notificationLogsTable),
    db
      .select({
        open: sql<number>`count(*) filter (where ${conversationsTable.status} = 'OPEN')::int`,
      })
      .from(conversationsTable),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(businessesTable)
      .where(inArray(businessesTable.slug, [...DEMO_WORLD_SLUGS])),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(sql`${usersTable.platformLegal} is null`),
    db
      .select({
        id: notificationLogsTable.id,
        channel: notificationLogsTable.channel,
        status: notificationLogsTable.status,
        createdAt: notificationLogsTable.createdAt,
      })
      .from(notificationLogsTable)
      .where(
        and(
          eq(notificationLogsTable.status, "FAILED"),
          gte(notificationLogsTable.createdAt, dayAgo),
        ),
      )
      .orderBy(desc(notificationLogsTable.createdAt))
      .limit(8),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(supportTicketsTable)
      .where(eq(supportTicketsTable.status, "open")),
  ]);

  const bs = bookingStats[0];
  const ms = messageStats[0];
  const cs = conversationStats[0];

  const middleware = {
    requestId: true,
    structuredLogging: true,
    compression:
      process.env.NODE_ENV === "production" || process.env.API_COMPRESS === "true",
    clerkAuth: Boolean(process.env.CLERK_SECRET_KEY),
    corsConfigured: true,
    sentry: Boolean(process.env.SENTRY_DSN_API ?? process.env.SENTRY_DSN),
    trustProxy:
      process.env.TRUST_PROXY === "true" || process.env.NODE_ENV === "production",
  };

  const integrations = {
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY ?? process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY),
    resend: Boolean(process.env.RESEND_API_KEY),
    twilio: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    stripe: health.stripeConfigured,
    inngest: health.inngestEnabled,
    meta: Boolean(process.env.META_APP_SECRET),
    webPush: Boolean(process.env.VAPID_PUBLIC_KEY),
  };

  const failsafes = {
    legalGateSkipped: isLegalGateSkipped(),
    demoPasswordConfigured: Boolean(process.env.LIVIA_DEMO_PASSWORD),
    betaSignupMode: process.env.LIVIA_BETA_SIGNUP_MODE ?? "open",
    unhandledErrorReturnsRequestId: true,
    publicChatRateLimit: true,
    webhookRawBodyStripe: true,
    sideEffectsMode: (await import("@workspace/policy")).resolveSideEffectMode(),
  };

  const alerts: Array<{ level: "warn" | "critical"; message: string }> = [];
  if (!dbOk) alerts.push({ level: "critical", message: "Database ping failed" });
  if (dbLatencyMs > 500) alerts.push({ level: "warn", message: `DB latency high (${dbLatencyMs}ms)` });
  if ((health.v3?.stuckContinuity ?? 0) > 0) {
    alerts.push({
      level: "warn",
      message: `${health.v3!.stuckContinuity} booking(s) stuck in continuity`,
    });
  }
  if ((ms?.failed24h ?? 0) > 10) {
    alerts.push({ level: "warn", message: `${ms!.failed24h} failed messages in 24h` });
  }
  if (!integrations.anthropic) {
    alerts.push({ level: "warn", message: "Liv AI key missing — chat degrades gracefully" });
  }

  return {
    ...health,
    collectedInMs: Date.now() - started,
    database: { ok: dbOk, latencyMs: dbLatencyMs },
    traffic: {
      bookingsTotal: bs?.total ?? 0,
      bookingsPending: bs?.pending ?? 0,
      bookingsToday: bs?.today ?? 0,
      messagesLast24h: ms?.last24h ?? 0,
      messagesFailed24h: ms?.failed24h ?? 0,
      conversationsOpen: cs?.open ?? 0,
    },
    demo: {
      worldSlugs: DEMO_WORLD_SLUGS.length,
      tenantsProvisioned: demoTenantCount[0]?.count ?? 0,
      ready:
        (demoTenantCount[0]?.count ?? 0) >= DEMO_WORLD_SLUGS.length - 2 &&
        (supportTicketsOpen[0]?.count ?? 0) >= 4,
    },
    support: {
      ticketsOpen: supportTicketsOpen[0]?.count ?? 0,
    },
    compliance: {
      usersMissingPlatformLegal: usersMissingLegal[0]?.count ?? 0,
      legalGateSkipped: failsafes.legalGateSkipped,
    },
    middleware,
    integrations,
    failsafes,
    alerts,
    recentFailedMessages: recentFailedMessages.map((r) => ({
      id: r.id,
      channel: r.channel,
      status: r.status,
      at: r.createdAt?.toISOString?.() ?? String(r.createdAt),
    })),
  };
}

/** Run in-process HTTP probes (no external k6 required). */
export async function runInternalStressProbes(apiBase: string): Promise<{
  probes: ObservabilityProbe[];
  passed: number;
  failed: number;
}> {
  const base = apiBase.replace(/\/+$/, "");
  const sampleSlug = "aurora-galway";

  const targets: Array<{ name: string; run: () => Promise<Response> }> = [
    { name: "healthz", run: () => fetch(`${base}/api/healthz`) },
    { name: "demo_status", run: () => fetch(`${base}/api/demo/status`) },
    { name: "public_business", run: () => fetch(`${base}/api/public/b/${sampleSlug}`) },
    { name: "onboarding_catalog_auth", run: () => fetch(`${base}/api/onboarding/catalog`) },
    { name: "me_requires_auth", run: () => fetch(`${base}/api/me/businesses`) },
    { name: "internal_ops_blocked", run: () => fetch(`${base}/api/internal/ops/platform-health`) },
  ];

  const probes: ObservabilityProbe[] = [];
  for (const t of targets) {
    const t0 = Date.now();
    try {
      const res = await t.run();
      const durationMs = Date.now() - t0;
      const expectOk =
        t.name === "me_requires_auth"
          ? res.status === 401
          : t.name === "internal_ops_blocked"
            ? res.status === 401 || res.status === 403
            : t.name === "onboarding_catalog_auth"
              ? res.status === 401
              : res.ok;
      probes.push({
        name: t.name,
        ok: expectOk,
        status: res.status,
        durationMs,
        detail: expectOk ? undefined : `unexpected ${res.status}`,
      });
    } catch (err) {
      probes.push({
        name: t.name,
        ok: false,
        durationMs: Date.now() - t0,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const passed = probes.filter((p) => p.ok).length;
  return { probes, passed, failed: probes.length - passed };
}

export async function backfillDemoPlatformLegal(): Promise<{
  updated: number;
  clerkCreated: number;
  accounts: number;
}> {
  const result = await ensureDemoIdentitiesForAllAccounts();
  return {
    updated: result.legalUpdated,
    clerkCreated: result.clerkCreated,
    accounts: result.accounts,
  };
}

/** Light repair when demo world exists but ops data (tickets, legal, onboarding) is thin. */
export async function ensureDemoOpsReadiness(): Promise<{
  provisioned: boolean;
  actions: string[];
  supportTicketsOpen: number;
  identities: { clerkCreated: number; legalUpdated: number; accounts: number };
}> {
  const status = await getDemoPortalStatus();
  const actions: string[] = [];

  if (!status.provisioned) {
    return {
      provisioned: false,
      actions: [
        "Demo world not provisioned — run pnpm demo:provision or dashboard /demo → Set up full demo world",
      ],
      supportTicketsOpen: 0,
      identities: { clerkCreated: 0, legalUpdated: 0, accounts: 0 },
    };
  }

  const identities = await ensureDemoIdentitiesForAllAccounts();
  actions.push(
    `Identities: ${identities.accounts} accounts (${identities.clerkCreated} new Clerk, ${identities.legalUpdated} legal updates)`,
  );

  const orgAdmin = DEMO_PERSONAS.find((p) => p.id === "org_admin");
  const orgAdminRow = orgAdmin
    ? await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, orgAdmin.email)).limit(1)
    : [];
  const submitterId = orgAdminRow[0]?.id;
  if (submitterId) {
    const seeded = await seedDemoSupportTickets(submitterId);
    if (seeded > 0) actions.push(`Support tickets: seeded ${seeded} open ticket(s)`);
  }

  const marked = await markDemoBusinessesOnboardingComplete();
  actions.push(`Onboarding: ${marked} businesses at 100%`);

  const open = await listAllSupportTicketsOpen(100);
  if (open.length === 0) {
    actions.push("Support queue still empty — re-run after org-admin user exists in DB");
  }

  return {
    provisioned: true,
    actions,
    supportTicketsOpen: open.length,
    identities: {
      clerkCreated: identities.clerkCreated,
      legalUpdated: identities.legalUpdated,
      accounts: identities.accounts,
    },
  };
}
