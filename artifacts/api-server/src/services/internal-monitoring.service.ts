import {
  db,
  eventsTable,
  notificationLogsTable,
  messageLogsTable,
  bookingsTable,
  businessesTable,
  quotesTable,
  enquiriesTable,
} from "@workspace/db";
import { sql, and, gte, desc, eq, or, ilike, inArray } from "drizzle-orm";
import {
  getLogBackendStatus,
  queryLokiLogs,
  queryOpenObserveLogs,
} from "../lib/external-log-query";
import { getPlatformObservability } from "./internal-observability.service";
import { evaluateAlertRules, listAlertFirings } from "./internal-ops-alerts.service";
import { getDemoPortalStatus } from "./demo-portal.service";
import { DEMO_WORLD_SLUGS } from "../lib/demo-portal-config";
import { auditAllVerticalPresentationPacks } from "@workspace/policy";
import { EVENT_OPERATOR_ADDON_EUR_CENTS, hasEffectiveEntitlement } from "@workspace/entitlements";
import { priceIdForEventOperatorAddon } from "../lib/stripe";

export type PlatformLogEntry = {
  id: string;
  source: "event" | "notification" | "message";
  timestamp: string;
  level: string;
  type: string;
  businessId: string | null;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  context: Record<string, unknown> | null;
};

export type MonitoringOverview = {
  observability: Awaited<ReturnType<typeof getPlatformObservability>>;
  logBackends: ReturnType<typeof getLogBackendStatus>;
  live: {
    refreshedAt: string;
    bookingsPerMinuteLastHour: number;
    eventsLast15m: number;
    failedNotificationsLast15m: number;
    payments: {
      stripeConfigured: boolean;
      pendingRefunds: number;
      failedPayments: number;
      stuckPaymentIntents: number;
    };
    providerDlqRecent: Array<{
      provider: string;
      operation: string;
      businessId: string | null;
      createdAt: string;
      error: string;
    }>;
  };
  alerts: {
    openCount: number;
    newlyFired: number;
    openFirings: Awaited<ReturnType<typeof listAlertFirings>>;
  };
};

export type TimeSeriesPoint = { hour: string; count: number };

export type MonitoringTimeSeries = {
  hours: number;
  bookings: TimeSeriesPoint[];
  eventsByLevel: Array<{ hour: string; INFO: number; WARN: number; ERROR: number }>;
  notifications: Array<{ hour: string; sent: number; failed: number }>;
};

export type DataFlowNode = {
  id: string;
  label: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  detail: string;
  lastActivityAt: string | null;
  count24h: number;
};

export type OpsOnboardingCheck = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail" | "manual";
  detail: string;
  action?: string;
};

export type PlatformCascadeHealth = {
  refreshedAt: string;
  presentation: Array<{
    vertical: string;
    ok: boolean;
    presetCount: number;
    morphs: string[];
    errors: string[];
  }>;
  payments: {
    guestQuoteDeposits24h: number;
    guestBookingDeposits24h: number;
    lastQuoteDepositAt: string | null;
    stripeConfigured: boolean;
  };
  consultFirst: {
    eventVendorTenants: number;
    openEnquiries: number;
    bookedQuotes24h: number;
    engagementNotifications24h: number;
  };
  entitlements: {
    eventVendorsWithPack: number;
    eventVendorsWithoutPack: number;
    stripeEventOperatorPriceConfigured: boolean;
    eventOperatorAddonEurCents: number;
  };
};

/** Policy cascade + consult-first automation health for Livia internal ops. */
export async function getPlatformCascadeHealth(): Promise<PlatformCascadeHealth> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const presentation = auditAllVerticalPresentationPacks().map((row) => ({
    vertical: row.vertical,
    ok: row.ok,
    presetCount: row.presetCount,
    morphs: row.morphs,
    errors: row.errors,
  }));

  const quoteDepositEvents = await db
    .select({ count: sql<number>`count(*)::int`, last: sql<string>`max(${eventsTable.createdAt})::text` })
    .from(eventsTable)
    .where(
      and(
        gte(eventsTable.createdAt, dayAgo),
        eq(eventsTable.type, "PAYMENT_SUCCEEDED"),
        sql`${eventsTable.context}::text ilike '%guestQuoteDeposit%'`,
      ),
    );

  const bookingDepositEvents = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eventsTable)
    .where(
      and(
        gte(eventsTable.createdAt, dayAgo),
        eq(eventsTable.type, "PAYMENT_SUCCEEDED"),
        sql`${eventsTable.context}::text ilike '%guestDeposit%'`,
      ),
    );

  const [eventVendorTenants, openEnquiries, bookedQuotes, engagementNotifs, paymentOps, eventVendorRows] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(businessesTable)
        .where(eq(businessesTable.vertical, "event-vendors")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(enquiriesTable)
        .where(inArray(enquiriesTable.status, ["new", "quoted", "accepted"])),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(quotesTable)
        .where(and(gte(quotesTable.updatedAt, dayAgo), eq(quotesTable.status, "booked"))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notificationLogsTable)
        .where(
          and(
            gte(notificationLogsTable.createdAt, dayAgo),
            or(
              ilike(notificationLogsTable.templateKey, "%quote.%"),
              ilike(notificationLogsTable.templateKey, "%client_withdrew%"),
            ),
          ),
        ),
      import("./payment.service")
        .then((m) => m.getPaymentOpsSummary())
        .catch(() => ({ stripeConfigured: false })),
      db
        .select({
          id: businessesTable.id,
          entitlementGrants: businessesTable.entitlementGrants,
          designPartnerEndsAt: businessesTable.designPartnerEndsAt,
        })
        .from(businessesTable)
        .where(eq(businessesTable.vertical, "event-vendors")),
    ]);

  let eventVendorsWithPack = 0;
  let eventVendorsWithoutPack = 0;
  const now = new Date();
  for (const row of eventVendorRows) {
    const grants = Array.isArray(row.entitlementGrants) ? row.entitlementGrants : [];
    const designPartner =
      !!row.designPartnerEndsAt && new Date(row.designPartnerEndsAt) > now;
    const entitled =
      designPartner ||
      hasEffectiveEntitlement(grants as never, "event_operator_pack");
    if (entitled) eventVendorsWithPack += 1;
    else eventVendorsWithoutPack += 1;
  }

  return {
    refreshedAt: new Date().toISOString(),
    presentation,
    payments: {
      guestQuoteDeposits24h: quoteDepositEvents[0]?.count ?? 0,
      guestBookingDeposits24h: bookingDepositEvents[0]?.count ?? 0,
      lastQuoteDepositAt: quoteDepositEvents[0]?.last ?? null,
      stripeConfigured: paymentOps.stripeConfigured ?? false,
    },
    consultFirst: {
      eventVendorTenants: eventVendorTenants[0]?.count ?? 0,
      openEnquiries: openEnquiries[0]?.count ?? 0,
      bookedQuotes24h: bookedQuotes[0]?.count ?? 0,
      engagementNotifications24h: engagementNotifs[0]?.count ?? 0,
    },
    entitlements: {
      eventVendorsWithPack,
      eventVendorsWithoutPack,
      stripeEventOperatorPriceConfigured: !!priceIdForEventOperatorAddon(),
      eventOperatorAddonEurCents: EVENT_OPERATOR_ADDON_EUR_CENTS,
    },
  };
}

/** Operator dashboard — extends observability with live counters and log backend status. */
export async function getMonitoringOverview(): Promise<MonitoringOverview> {
  const observability = await getPlatformObservability();
  const logBackends = getLogBackendStatus();
  const fifteenAgo = new Date(Date.now() - 15 * 60 * 1000);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const getPaymentOpsSummary = await import("./payment.service")
    .then((m) => m.getPaymentOpsSummary)
    .catch(() => null);
  const listRecentProviderDlq = await import("./stripe-events.service")
    .then((m) => m.listRecentProviderDlq)
    .catch(() => null);

  const [events15, failedNotif15, bookingsHour, alertEval, openFirings, payments, dlq] =
    await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventsTable)
      .where(gte(eventsTable.createdAt, fifteenAgo)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notificationLogsTable)
      .where(
        and(
          gte(notificationLogsTable.createdAt, fifteenAgo),
          eq(notificationLogsTable.status, "FAILED"),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(gte(bookingsTable.createdAt, hourAgo)),
    evaluateAlertRules(),
    listAlertFirings(12, true),
    getPaymentOpsSummary
      ? getPaymentOpsSummary().catch(() => ({
          stripeConfigured: false,
          pendingRefunds: 0,
          failedPayments: 0,
          stuckPaymentIntents: 0,
        }))
      : {
          stripeConfigured: false,
          pendingRefunds: 0,
          failedPayments: 0,
          stuckPaymentIntents: 0,
        },
    listRecentProviderDlq ? listRecentProviderDlq(12).catch(() => []) : [],
  ]);

  return {
    observability,
    logBackends,
    live: {
      refreshedAt: new Date().toISOString(),
      bookingsPerMinuteLastHour: Math.round((bookingsHour[0]?.count ?? 0) / 60),
      eventsLast15m: events15[0]?.count ?? 0,
      failedNotificationsLast15m: failedNotif15[0]?.count ?? 0,
      payments,
      providerDlqRecent: dlq.map((d) => ({
        provider: d.provider,
        operation: d.operation,
        businessId: d.businessId ?? null,
        createdAt: d.createdAt?.toISOString?.() ?? String(d.createdAt),
        error: d.error,
      })),
    },
    alerts: {
      openCount: alertEval.openCount,
      newlyFired: alertEval.newlyFired,
      openFirings,
    },
  };
}

/** Hourly buckets for charts in internal portal. */
export async function getMonitoringTimeSeries(hours = 24): Promise<MonitoringTimeSeries> {
  const h = Math.min(Math.max(hours, 1), 168);
  const since = new Date(Date.now() - h * 60 * 60 * 1000);

  const [bookingRows, eventRows, notifRows] = await Promise.all([
    db
      .select({
        hour: sql<string>`date_trunc('hour', ${bookingsTable.createdAt})::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(bookingsTable)
      .where(gte(bookingsTable.createdAt, since))
      .groupBy(sql`date_trunc('hour', ${bookingsTable.createdAt})`)
      .orderBy(sql`date_trunc('hour', ${bookingsTable.createdAt})`),
    db
      .select({
        hour: sql<string>`date_trunc('hour', ${eventsTable.createdAt})::text`,
        level: eventsTable.level,
        count: sql<number>`count(*)::int`,
      })
      .from(eventsTable)
      .where(gte(eventsTable.createdAt, since))
      .groupBy(
        sql`date_trunc('hour', ${eventsTable.createdAt})`,
        eventsTable.level,
      )
      .orderBy(sql`date_trunc('hour', ${eventsTable.createdAt})`),
    db
      .select({
        hour: sql<string>`date_trunc('hour', ${notificationLogsTable.createdAt})::text`,
        status: notificationLogsTable.status,
        count: sql<number>`count(*)::int`,
      })
      .from(notificationLogsTable)
      .where(gte(notificationLogsTable.createdAt, since))
      .groupBy(
        sql`date_trunc('hour', ${notificationLogsTable.createdAt})`,
        notificationLogsTable.status,
      )
      .orderBy(sql`date_trunc('hour', ${notificationLogsTable.createdAt})`),
  ]);

  const eventByHour = new Map<string, { INFO: number; WARN: number; ERROR: number }>();
  for (const row of eventRows) {
    const key = row.hour;
    if (!eventByHour.has(key)) eventByHour.set(key, { INFO: 0, WARN: 0, ERROR: 0 });
    const bucket = eventByHour.get(key)!;
    if (row.level === "INFO") bucket.INFO += row.count;
    else if (row.level === "WARN") bucket.WARN += row.count;
    else if (row.level === "ERROR") bucket.ERROR += row.count;
  }

  const notifByHour = new Map<string, { sent: number; failed: number }>();
  for (const row of notifRows) {
    const key = row.hour;
    if (!notifByHour.has(key)) notifByHour.set(key, { sent: 0, failed: 0 });
    const bucket = notifByHour.get(key)!;
    if (row.status === "FAILED") bucket.failed += row.count;
    else bucket.sent += row.count;
  }

  return {
    hours: h,
    bookings: bookingRows.map((r) => ({ hour: r.hour, count: r.count })),
    eventsByLevel: [...eventByHour.entries()].map(([hour, levels]) => ({ hour, ...levels })),
    notifications: [...notifByHour.entries()].map(([hour, n]) => ({ hour, ...n })),
  };
}

export type PlatformLogSearchFilters = {
  q?: string;
  level?: string;
  source?: string;
  type?: string;
  businessId?: string;
  requestId?: string;
  hours?: number;
  limit?: number;
};

/** Unified platform log search — events, notifications, SMS/message logs. */
export async function searchPlatformLogs(
  filters: PlatformLogSearchFilters,
): Promise<{ entries: PlatformLogEntry[]; total: number }> {
  const hours = Math.min(Math.max(filters.hours ?? 24, 1), 168);
  const limit = Math.min(Math.max(filters.limit ?? 150, 1), 300);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const q = filters.q?.trim();
  const requestId = filters.requestId?.trim();

  const eventConds = [gte(eventsTable.createdAt, since)];
  if (filters.level) eventConds.push(eq(eventsTable.level, filters.level as "INFO" | "WARN" | "ERROR"));
  if (filters.source) eventConds.push(eq(eventsTable.source, filters.source));
  if (filters.type) eventConds.push(ilike(eventsTable.type, `%${filters.type}%`));
  if (filters.businessId) eventConds.push(eq(eventsTable.businessId, filters.businessId));
  if (q) {
    eventConds.push(
      or(
        ilike(eventsTable.type, `%${q}%`),
        ilike(eventsTable.entityType, `%${q}%`),
        ilike(eventsTable.entityId, `%${q}%`),
        sql`${eventsTable.context}::text ilike ${"%" + q + "%"}`,
      )!,
    );
  }
  if (requestId) {
    eventConds.push(sql`${eventsTable.context}::text ilike ${"%" + requestId + "%"}`);
  }

  const [events, notifications, messages] = await Promise.all([
    db
      .select()
      .from(eventsTable)
      .where(and(...eventConds))
      .orderBy(desc(eventsTable.createdAt))
      .limit(limit),
    db
      .select()
      .from(notificationLogsTable)
      .where(
        and(
          gte(notificationLogsTable.createdAt, since),
          filters.businessId
            ? eq(notificationLogsTable.businessId, filters.businessId)
            : undefined,
          q
            ? or(
                ilike(notificationLogsTable.templateKey, `%${q}%`),
                ilike(notificationLogsTable.channel, `%${q}%`),
                sql`${notificationLogsTable.payload}::text ilike ${"%" + q + "%"}`,
              )
            : undefined,
        ),
      )
      .orderBy(desc(notificationLogsTable.createdAt))
      .limit(Math.floor(limit / 2)),
    db
      .select({
        id: messageLogsTable.id,
        businessId: messageLogsTable.businessId,
        channelType: messageLogsTable.channelType,
        direction: messageLogsTable.direction,
        content: messageLogsTable.content,
        metadata: messageLogsTable.metadata,
        createdAt: messageLogsTable.createdAt,
      })
      .from(messageLogsTable)
      .where(
        and(
          gte(messageLogsTable.createdAt, since),
          filters.businessId
            ? eq(messageLogsTable.businessId, filters.businessId)
            : undefined,
          q
            ? or(
                ilike(messageLogsTable.content, `%${q}%`),
                ilike(messageLogsTable.channelType, `%${q}%`),
                sql`${messageLogsTable.metadata}::text ilike ${"%" + q + "%"}`,
              )
            : undefined,
        ),
      )
      .orderBy(desc(messageLogsTable.createdAt))
      .limit(Math.floor(limit / 3)),
  ]);

  const entries: PlatformLogEntry[] = [];

  for (const e of events) {
    const ctx = (e.context as Record<string, unknown> | null) ?? null;
    entries.push({
      id: e.id,
      source: "event",
      timestamp: e.createdAt.toISOString(),
      level: e.level,
      type: e.type,
      businessId: e.businessId,
      entityType: e.entityType,
      entityId: e.entityId,
      summary: `${e.source} · ${e.type}`,
      context: ctx,
    });
  }

  for (const n of notifications) {
    const payload = (n.payload as Record<string, unknown> | null) ?? null;
    entries.push({
      id: n.id,
      source: "notification",
      timestamp: n.createdAt.toISOString(),
      level: n.status === "FAILED" ? "ERROR" : "INFO",
      type: `NOTIFICATION_${n.channel}`,
      businessId: n.businessId,
      entityType: "booking",
      entityId: n.bookingId,
      summary: `${n.channel} ${n.templateKey ?? ""} → ${n.status}`.trim(),
      context: payload,
    });
  }

  for (const m of messages) {
    const preview =
      m.content.length > 120 ? `${m.content.slice(0, 120)}…` : m.content;
    entries.push({
      id: m.id,
      source: "message",
      timestamp: m.createdAt.toISOString(),
      level: "INFO",
      type: `MESSAGE_${m.direction}`,
      businessId: m.businessId,
      entityType: "channel",
      entityId: m.channelType,
      summary: `${m.channelType} ${m.direction}: ${preview}`,
      context: (m.metadata as Record<string, unknown> | null) ?? null,
    });
  }

  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return { entries: entries.slice(0, limit), total: entries.length };
}

export async function queryExternalLogsForOps(args: {
  backend?: "loki" | "openobserve" | "auto";
  query?: string;
  sql?: string;
  hours?: number;
  tenantId?: string;
  requestId?: string;
  level?: string;
  limit?: number;
}) {
  const hours = Math.min(Math.max(args.hours ?? 6, 1), 72);
  const end = new Date();
  const start = new Date(Date.now() - hours * 60 * 60 * 1000);
  const limit = args.limit ?? 100;

  const prefer = args.backend ?? "auto";
  const status = getLogBackendStatus();

  if (prefer === "openobserve" || (prefer === "auto" && status.openObserve)) {
    const stream = process.env.OPENOBSERVE_STREAM?.trim() || "default";
    const parts: string[] = [`SELECT * FROM ${stream}`];
    const where: string[] = [];
    if (args.tenantId) where.push(`tenant_id = '${args.tenantId.replace(/'/g, "''")}'`);
    if (args.requestId) where.push(`request_id = '${args.requestId.replace(/'/g, "''")}'`);
    if (args.level) where.push(`level = '${args.level.replace(/'/g, "''")}'`);
    if (args.query?.trim()) where.push(`body LIKE '%${args.query.trim().replace(/'/g, "''")}%'`);
    if (where.length) parts.push(`WHERE ${where.join(" AND ")}`);
    parts.push("ORDER BY _timestamp DESC");
    return queryOpenObserveLogs({
      sql: args.sql?.trim() || parts.join(" "),
      limit,
    });
  }

  let logql =
    args.query?.trim() ||
    '{service="api-server"} | json | line_format "{{.level}} {{.method}} {{.path}} {{.status}} {{.msg}}"';
  if (args.tenantId) logql += ` | tenant_id="${args.tenantId}"`;
  if (args.requestId) logql += ` | request_id="${args.requestId}"`;
  if (args.level) logql += ` | level="${args.level}"`;

  return queryLokiLogs({
    query: logql,
    start: start.toISOString(),
    end: end.toISOString(),
    limit,
  });
}

/** Integration / pipeline health from recent domain events. */
export async function getDataFlowStatus(): Promise<{ flows: DataFlowNode[]; refreshedAt: string }> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const obs = await getPlatformObservability();

  const countTypes = async (types: string[]) => {
    const rows = await db
      .select({ count: sql<number>`count(*)::int`, last: sql<string>`max(${eventsTable.createdAt})::text` })
      .from(eventsTable)
      .where(
        and(gte(eventsTable.createdAt, dayAgo), inArray(eventsTable.type, types)),
      );
    return { count: rows[0]?.count ?? 0, last: rows[0]?.last ?? null };
  };

  const [payments, messages, ai, bookings, quoteDeposits, consultQuotes] = await Promise.all([
    countTypes(["PAYMENT_SUCCEEDED", "PAYMENT_FAILED", "PAYMENT_INTENT_CREATED"]),
    countTypes(["MESSAGE_RECEIVED", "MESSAGE_SENT", "NOTIFICATION_SENT", "NOTIFICATION_FAILED"]),
    countTypes(["AI_OBSERVATION_CREATED"]),
    db
      .select({
        count: sql<number>`count(*)::int`,
        last: sql<string>`max(${bookingsTable.createdAt})::text`,
      })
      .from(bookingsTable)
      .where(gte(bookingsTable.createdAt, dayAgo)),
    countTypes(["PAYMENT_SUCCEEDED"]).then(async (base) => {
      const rows = await db
        .select({ count: sql<number>`count(*)::int`, last: sql<string>`max(${eventsTable.createdAt})::text` })
        .from(eventsTable)
        .where(
          and(
            gte(eventsTable.createdAt, dayAgo),
            eq(eventsTable.type, "PAYMENT_SUCCEEDED"),
            sql`${eventsTable.context}::text ilike '%guestQuoteDeposit%'`,
          ),
        );
      return { count: rows[0]?.count ?? 0, last: rows[0]?.last ?? base.last };
    }),
    db
      .select({ count: sql<number>`count(*)::int`, last: sql<string>`max(${quotesTable.updatedAt})::text` })
      .from(quotesTable)
      .where(and(gte(quotesTable.updatedAt, dayAgo), eq(quotesTable.status, "booked"))),
  ]);

  const stripeStatus: DataFlowNode["status"] = obs.integrations.stripe
    ? payments.count > 0
      ? "healthy"
      : "unknown"
    : "degraded";

  const flows: DataFlowNode[] = [
    {
      id: "api-http",
      label: "API (structured logs)",
      status: obs.database.ok ? "healthy" : "down",
      detail: obs.middleware.structuredLogging
        ? "Pino JSON + request_id on every request"
        : "Structured logging off",
      lastActivityAt: new Date().toISOString(),
      count24h: obs.traffic.bookingsToday + obs.traffic.messagesLast24h,
    },
    {
      id: "postgres",
      label: "Postgres / Drizzle",
      status: obs.database.ok ? (obs.database.latencyMs > 500 ? "degraded" : "healthy") : "down",
      detail: `Latency ${obs.database.latencyMs}ms`,
      lastActivityAt: new Date().toISOString(),
      count24h: obs.traffic.bookingsTotal,
    },
    {
      id: "bookings",
      label: "Booking pipeline",
      status: bookings[0]?.count ? "healthy" : "unknown",
      detail: `${bookings[0]?.count ?? 0} bookings created (24h)`,
      lastActivityAt: bookings[0]?.last,
      count24h: bookings[0]?.count ?? 0,
    },
    {
      id: "stripe",
      label: "Stripe billing",
      status: stripeStatus,
      detail: obs.integrations.stripe ? `${payments.count} payment events (24h)` : "Not configured",
      lastActivityAt: payments.last,
      count24h: payments.count,
    },
    {
      id: "channels",
      label: "SMS / email / push",
      status:
        obs.traffic.messagesFailed24h > 10
          ? "degraded"
          : obs.integrations.twilio || obs.integrations.resend
            ? "healthy"
            : "unknown",
      detail: `${obs.traffic.messagesLast24h} notifications · ${obs.traffic.messagesFailed24h} failed`,
      lastActivityAt: messages.last,
      count24h: messages.count,
    },
    {
      id: "liv-ai",
      label: "Liv AI",
      status: obs.integrations.anthropic ? (ai.count > 0 ? "healthy" : "unknown") : "degraded",
      detail: `${ai.count} AI observations (24h)`,
      lastActivityAt: ai.last,
      count24h: ai.count,
    },
    {
      id: "inngest",
      label: "Inngest workflows",
      status: obs.integrations.inngest ? "healthy" : "degraded",
      detail: obs.integrations.inngest ? "Workflow runner enabled" : "Inngest disabled",
      lastActivityAt: null,
      count24h: obs.v3?.stuckContinuity ?? 0,
    },
    {
      id: "guest-quote-deposit",
      label: "Event quote deposits",
      status: quoteDeposits.count > 0 ? "healthy" : obs.integrations.stripe ? "unknown" : "degraded",
      detail: `${quoteDeposits.count} guest quote deposit events (24h) — event-vendors only`,
      lastActivityAt: quoteDeposits.last,
      count24h: quoteDeposits.count,
    },
    {
      id: "consult-first-quotes",
      label: "Consult-first quotes",
      status: consultQuotes[0]?.count ? "healthy" : "unknown",
      detail: `${consultQuotes[0]?.count ?? 0} quotes marked booked (24h)`,
      lastActivityAt: consultQuotes[0]?.last ?? null,
      count24h: consultQuotes[0]?.count ?? 0,
    },
    {
      id: "loki",
      label: "Loki log sink",
      status: getLogBackendStatus().lokiPush ? "healthy" : "unknown",
      detail: getLogBackendStatus().lokiPush
        ? "LOKI_PUSH_URL active — query in Logs tab"
        : "Set LOKI_PUSH_URL + pnpm observability:up for deep log search",
      lastActivityAt: null,
      count24h: 0,
    },
  ];

  return { flows, refreshedAt: new Date().toISOString() };
}

/** Checklist for new internal operators — ready to use portal after onboarding. */
export async function getInternalOpsOnboardingChecklist(): Promise<{
  ready: boolean;
  score: number;
  checks: OpsOnboardingCheck[];
}> {
  const [obs, demoStatus, demoCount] = await Promise.all([
    getPlatformObservability(),
    getDemoPortalStatus(),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(businessesTable)
      .where(inArray(businessesTable.slug, [...DEMO_WORLD_SLUGS])),
  ]);

  const logBackends = getLogBackendStatus();
  const checks: OpsOnboardingCheck[] = [
    {
      id: "db",
      label: "Database reachable",
      status: obs.database.ok ? "pass" : "fail",
      detail: obs.database.ok ? `${obs.database.latencyMs}ms ping` : "SELECT 1 failed",
      action: "pnpm db:migrate:sql && check DATABASE_URL",
    },
    {
      id: "clerk",
      label: "Clerk auth configured",
      status: obs.clerkConfigured ? "pass" : "fail",
      detail: obs.clerkConfigured ? "Clerk secret present" : "CLERK_SECRET_KEY missing",
    },
    {
      id: "internal-secret",
      label: "Internal ops secret (API)",
      status: Boolean(process.env.INTERNAL_OPS_SECRET?.trim()) ? "pass" : "fail",
      detail: "INTERNAL_OPS_SECRET in .env — match token in portal sign-in",
    },
    {
      id: "operator-identity",
      label: "Operator email + RBAC role",
      status: "manual",
      detail: "Set at sign-in — X-Internal-Ops-Operator / Role headers on every request",
      action: "Use founder or engineer role for mutations",
    },
    {
      id: "demo-world",
      label: "Demo world provisioned",
      status: demoStatus.provisioned ? "pass" : "warn",
      detail: demoStatus.provisioned
        ? `${demoCount[0]?.count ?? 0} demo tenants`
        : "Run pnpm demo:provision",
      action: "pnpm demo:provision",
    },
    {
      id: "demo-ops-ready",
      label: "Demo ops data (tickets, legal)",
      status: obs.demo.ready ? "pass" : "warn",
      detail: obs.demo.ready
        ? `${obs.support.ticketsOpen} open tickets · demo identities OK`
        : "Monitoring → Onboarding → Repair demo ops",
      action: "POST /internal/ops/demo/ensure-ready (dev only)",
    },
    {
      id: "sentry",
      label: "Sentry error tracking",
      status: obs.middleware.sentry ? "pass" : "warn",
      detail: obs.middleware.sentry ? "SENTRY_DSN configured" : "Optional but recommended for prod",
    },
    {
      id: "loki",
      label: "Deep log search (Loki)",
      status: logBackends.lokiQuery ? "pass" : "warn",
      detail: logBackends.lokiQuery
        ? "Loki query available — use Logs → Loki"
        : "pnpm observability:up + LOKI_PUSH_URL",
      action: "pnpm observability:up",
    },
    {
      id: "openobserve",
      label: "OpenObserve (optional)",
      status: logBackends.openObserve ? "pass" : "manual",
      detail: logBackends.openObserve
        ? "OPENOBSERVE_URL configured"
        : "Set OPENOBSERVE_* for hosted log analytics",
    },
    {
      id: "liv-ai",
      label: "Liv AI key",
      status: obs.integrations.anthropic ? "pass" : "warn",
      detail: obs.integrations.anthropic ? "Anthropic configured" : "Chat/Liv triage degraded",
    },
    {
      id: "inngest",
      label: "Workflows (Inngest)",
      status: obs.integrations.inngest ? "pass" : "warn",
      detail: obs.integrations.inngest ? "Inngest enabled" : "Reminders/continuity workflows off",
    },
  ];

  const scored = checks.filter((c) => c.status === "pass").length;
  const required = ["db", "internal-secret", "demo-world"];
  const ready = required.every((id) => checks.find((c) => c.id === id)?.status === "pass");

  return {
    ready,
    score: Math.round((scored / checks.length) * 100),
    checks,
  };
}
