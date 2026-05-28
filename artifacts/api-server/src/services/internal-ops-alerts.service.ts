import {
  db,
  eventsTable,
  notificationLogsTable,
  internalOpsAlertRulesTable,
  internalOpsAlertFiringsTable,
  internalOpsSavedLogSearchesTable,
  internalOpsGrafanaPanelsTable,
  BUILTIN_ALERT_METRICS,
  type BuiltinAlertMetric,
} from "@workspace/db";
import { sql, eq, and, gte, desc, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getPlatformObservability } from "./internal-observability.service";
import { getLogBackendStatus } from "../lib/external-log-query";

const DEFAULT_RULES: Array<{
  name: string;
  description: string;
  severity: "warn" | "critical";
  metricKey: BuiltinAlertMetric;
  operator: "gt" | "gte" | "lt" | "lte" | "eq";
  threshold: number;
  windowMinutes: number;
}> = [
  {
    name: "Database latency high",
    description: "Postgres ping exceeds threshold — investigate connection pool or load.",
    severity: "critical",
    metricKey: "db_latency_ms",
    operator: "gt",
    threshold: 500,
    windowMinutes: 5,
  },
  {
    name: "Failed notifications (24h)",
    description: "SMS/email/push failures spiking — check Twilio/Resend.",
    severity: "warn",
    metricKey: "failed_notifications_24h",
    operator: "gt",
    threshold: 10,
    windowMinutes: 60,
  },
  {
    name: "Failed notifications (15m)",
    description: "Short-window delivery failures — proactive before customers notice.",
    severity: "critical",
    metricKey: "failed_notifications_15m",
    operator: "gt",
    threshold: 3,
    windowMinutes: 15,
  },
  {
    name: "Stuck booking continuity",
    description: "Bookings stuck in continuity workflow — Liv handoff may need ops.",
    severity: "warn",
    metricKey: "stuck_continuity",
    operator: "gt",
    threshold: 0,
    windowMinutes: 15,
  },
  {
    name: "Error events (15m)",
    description: "Domain ERROR events in events table.",
    severity: "warn",
    metricKey: "events_error_15m",
    operator: "gt",
    threshold: 5,
    windowMinutes: 15,
  },
  {
    name: "Open support tickets",
    description: "Internal queue depth — assign or triage.",
    severity: "warn",
    metricKey: "support_tickets_open",
    operator: "gt",
    threshold: 25,
    windowMinutes: 60,
  },
];

const DEFAULT_GRAFANA_PANELS: Array<{
  id: string;
  title: string;
  panelType: "explore" | "dashboard" | "external";
  embedPath: string;
  sortOrder: number;
  description: string;
}> = [
  {
    id: "livia-api-health",
    title: "Livia API Health (dashboard)",
    panelType: "dashboard",
    embedPath: "/d/livia-api-health/livia-api-health?orgId=1&from=now-6h&to=now",
    sortOrder: 0,
    description: "Error rate, log stream, 5xx — requires pnpm observability:up",
  },
  {
    id: "loki-explore",
    title: "Loki Explore",
    panelType: "explore",
    embedPath: "/explore?orgId=1",
    sortOrder: 1,
    description: "Ad-hoc LogQL — filter tenant_id / request_id in UI",
  },
];

const DEFAULT_SAVED_SEARCHES: Array<{
  id: string;
  name: string;
  backend: "platform" | "loki";
  queryJson: Record<string, unknown>;
  pinned: boolean;
}> = [
  {
    id: "errors-24h",
    name: "Platform errors (24h)",
    backend: "platform",
    queryJson: { level: "ERROR", hours: 24 },
    pinned: true,
  },
  {
    id: "failed-notifications",
    name: "Failed notifications",
    backend: "platform",
    queryJson: { q: "FAILED", hours: 24 },
    pinned: true,
  },
  {
    id: "loki-api-errors",
    name: "Loki: API errors",
    backend: "loki",
    queryJson: {
      logql: '{service="api-server"} | json | level="error"',
      hours: 6,
    },
    pinned: true,
  },
];

function compareMetric(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case "gt":
      return value > threshold;
    case "gte":
      return value >= threshold;
    case "lt":
      return value < threshold;
    case "lte":
      return value <= threshold;
    case "eq":
      return value === threshold;
    default:
      return false;
  }
}

/** Collect live metric values for rule evaluation. */
export async function collectAlertMetrics(): Promise<Record<BuiltinAlertMetric, number>> {
  const obs = await getPlatformObservability();
  const fifteenAgo = new Date(Date.now() - 15 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [errors15, warns15, failed15] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventsTable)
      .where(and(gte(eventsTable.createdAt, fifteenAgo), eq(eventsTable.level, "ERROR"))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventsTable)
      .where(and(gte(eventsTable.createdAt, fifteenAgo), eq(eventsTable.level, "WARN"))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notificationLogsTable)
      .where(
        and(
          gte(notificationLogsTable.createdAt, fifteenAgo),
          eq(notificationLogsTable.status, "FAILED"),
        ),
      ),
  ]);

  return {
    db_latency_ms: obs.database.latencyMs,
    failed_notifications_24h: obs.traffic.messagesFailed24h,
    failed_notifications_15m: failed15[0]?.count ?? 0,
    stuck_continuity: obs.v3?.stuckContinuity ?? 0,
    events_error_15m: errors15[0]?.count ?? 0,
    events_warn_15m: warns15[0]?.count ?? 0,
    bookings_pending: obs.traffic.bookingsPending,
    support_tickets_open: obs.support.ticketsOpen,
    conversations_open: obs.traffic.conversationsOpen,
  };
}

async function ensureDefaultAlertRules(): Promise<void> {
  const existing = await db.select({ id: internalOpsAlertRulesTable.id }).from(internalOpsAlertRulesTable).limit(1);
  if (existing.length > 0) return;

  for (const r of DEFAULT_RULES) {
    await db.insert(internalOpsAlertRulesTable).values({
      id: randomUUID(),
      name: r.name,
      description: r.description,
      enabled: true,
      severity: r.severity,
      metricKey: r.metricKey,
      operator: r.operator,
      threshold: String(r.threshold),
      windowMinutes: r.windowMinutes,
      createdBy: "system",
    });
  }
}

function resolveDefaultGrafanaPanels(): typeof DEFAULT_GRAFANA_PANELS {
  const raw = process.env.INTERNAL_GRAFANA_PANELS_JSON?.trim();
  if (!raw) return DEFAULT_GRAFANA_PANELS;
  try {
    const parsed = JSON.parse(raw) as typeof DEFAULT_GRAFANA_PANELS;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_GRAFANA_PANELS;
  } catch {
    return DEFAULT_GRAFANA_PANELS;
  }
}

async function ensureDefaultGrafanaPanels(): Promise<void> {
  // Grafana is intentionally optional. If there is no configured base URL,
  // we do not seed any Grafana panel rows (built-in Monitoring is the source of truth).
  const configuredBase =
    process.env.GRAFANA_EMBED_BASE_URL?.trim() ||
    process.env.GRAFANA_LOCAL_URL?.trim() ||
    process.env.INTERNAL_GRAFANA_URL?.trim() ||
    getLogBackendStatus().grafanaLocalUrl;
  if (!configuredBase) return;

  const existing = await db.select({ id: internalOpsGrafanaPanelsTable.id }).from(internalOpsGrafanaPanelsTable).limit(1);
  if (existing.length > 0) return;

  for (const p of resolveDefaultGrafanaPanels()) {
    await db.insert(internalOpsGrafanaPanelsTable).values({
      id: p.id,
      title: p.title,
      panelType: p.panelType,
      embedPath: p.embedPath,
      sortOrder: p.sortOrder,
      enabled: true,
      description: p.description,
    });
  }
}

async function ensureDefaultSavedSearches(): Promise<void> {
  const existing = await db
    .select({ id: internalOpsSavedLogSearchesTable.id })
    .from(internalOpsSavedLogSearchesTable)
    .limit(1);
  if (existing.length > 0) return;

  for (const s of DEFAULT_SAVED_SEARCHES) {
    await db.insert(internalOpsSavedLogSearchesTable).values({
      id: s.id,
      name: s.name,
      backend: s.backend,
      queryJson: s.queryJson,
      pinned: s.pinned,
      createdBy: "system",
    });
  }
}

export async function seedInternalOpsMonitoringDefaults(): Promise<void> {
  // Grafana is optional; seeding panels is gated inside ensureDefaultGrafanaPanels.
  await Promise.all([ensureDefaultAlertRules(), ensureDefaultGrafanaPanels(), ensureDefaultSavedSearches()]);
}

export async function listAlertRules() {
  await ensureDefaultAlertRules();
  return db
    .select()
    .from(internalOpsAlertRulesTable)
    .orderBy(desc(internalOpsAlertRulesTable.updatedAt));
}

export async function createAlertRule(input: {
  name: string;
  description?: string;
  severity: "warn" | "critical";
  metricKey: string;
  operator: string;
  threshold: number;
  windowMinutes?: number;
  createdBy?: string;
}) {
  if (!BUILTIN_ALERT_METRICS.includes(input.metricKey as BuiltinAlertMetric)) {
    throw new Error(`Unknown metric_key. Use: ${BUILTIN_ALERT_METRICS.join(", ")}`);
  }
  const id = randomUUID();
  const now = new Date();
  await db.insert(internalOpsAlertRulesTable).values({
    id,
    name: input.name,
    description: input.description ?? null,
    enabled: true,
    severity: input.severity,
    metricKey: input.metricKey,
    operator: input.operator,
    threshold: String(input.threshold),
    windowMinutes: input.windowMinutes ?? 15,
    createdBy: input.createdBy ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return (await db.select().from(internalOpsAlertRulesTable).where(eq(internalOpsAlertRulesTable.id, id)))[0];
}

export async function patchAlertRule(
  id: string,
  patch: Partial<{
    name: string;
    description: string | null;
    enabled: boolean;
    severity: string;
    threshold: number;
    windowMinutes: number;
  }>,
) {
  await db
    .update(internalOpsAlertRulesTable)
    .set({
      ...patch,
      threshold: patch.threshold !== undefined ? String(patch.threshold) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(internalOpsAlertRulesTable.id, id));
  return (await db.select().from(internalOpsAlertRulesTable).where(eq(internalOpsAlertRulesTable.id, id)))[0];
}

export async function listAlertFirings(limit = 50, openOnly = false) {
  const conds = openOnly ? [isNull(internalOpsAlertFiringsTable.resolvedAt)] : [];
  const rows = await db
    .select({
      firing: internalOpsAlertFiringsTable,
      ruleName: internalOpsAlertRulesTable.name,
      severity: internalOpsAlertRulesTable.severity,
    })
    .from(internalOpsAlertFiringsTable)
    .innerJoin(
      internalOpsAlertRulesTable,
      eq(internalOpsAlertFiringsTable.ruleId, internalOpsAlertRulesTable.id),
    )
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(internalOpsAlertFiringsTable.firedAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r.firing,
    ruleName: r.ruleName,
    severity: r.severity,
    valueAtFire: Number(r.firing.valueAtFire),
  }));
}

export async function acknowledgeAlertFiring(id: string, operator: string) {
  await db
    .update(internalOpsAlertFiringsTable)
    .set({
      acknowledgedBy: operator,
      acknowledgedAt: new Date(),
    })
    .where(eq(internalOpsAlertFiringsTable.id, id));
}

export async function resolveAlertFiring(id: string) {
  await db
    .update(internalOpsAlertFiringsTable)
    .set({ resolvedAt: new Date() })
    .where(eq(internalOpsAlertFiringsTable.id, id));
}

/** Evaluate rules; create firings when breached (dedupe open firing per rule). */
export async function evaluateAlertRules(): Promise<{
  evaluated: number;
  newlyFired: number;
  openCount: number;
  metrics: Record<string, number>;
}> {
  await ensureDefaultAlertRules();
  const [rules, metrics] = await Promise.all([listAlertRules(), collectAlertMetrics()]);
  let newlyFired = 0;

  for (const rule of rules) {
    if (!rule.enabled) continue;
    const key = rule.metricKey as BuiltinAlertMetric;
    const value = metrics[key] ?? 0;
    const threshold = Number(rule.threshold);
    if (!compareMetric(value, rule.operator, threshold)) continue;

    const open = await db
      .select({ id: internalOpsAlertFiringsTable.id })
      .from(internalOpsAlertFiringsTable)
      .where(
        and(
          eq(internalOpsAlertFiringsTable.ruleId, rule.id),
          isNull(internalOpsAlertFiringsTable.resolvedAt),
        ),
      )
      .limit(1);

    if (open.length > 0) continue;

    await db.insert(internalOpsAlertFiringsTable).values({
      id: randomUUID(),
      ruleId: rule.id,
      valueAtFire: String(value),
      message: `${rule.name}: ${key}=${value} (threshold ${rule.operator} ${threshold})`,
      metadata: { metricKey: key, operator: rule.operator, threshold },
    });
    newlyFired += 1;
  }

  const openRows = await listAlertFirings(200, true);
  return {
    evaluated: rules.filter((r) => r.enabled).length,
    newlyFired,
    openCount: openRows.length,
    metrics: metrics as Record<string, number>,
  };
}

export async function listSavedLogSearches() {
  await ensureDefaultSavedSearches();
  return db
    .select()
    .from(internalOpsSavedLogSearchesTable)
    .orderBy(
      desc(internalOpsSavedLogSearchesTable.pinned),
      desc(internalOpsSavedLogSearchesTable.createdAt),
    );
}

export async function createSavedLogSearch(input: {
  name: string;
  backend: "platform" | "loki" | "openobserve";
  queryJson: Record<string, unknown>;
  pinned?: boolean;
  createdBy?: string;
}) {
  const id = randomUUID();
  await db.insert(internalOpsSavedLogSearchesTable).values({
    id,
    name: input.name,
    backend: input.backend,
    queryJson: input.queryJson,
    pinned: input.pinned ?? false,
    createdBy: input.createdBy ?? null,
  });
  return (await db.select().from(internalOpsSavedLogSearchesTable).where(eq(internalOpsSavedLogSearchesTable.id, id)))[0];
}

export async function deleteSavedLogSearch(id: string) {
  await db.delete(internalOpsSavedLogSearchesTable).where(eq(internalOpsSavedLogSearchesTable.id, id));
}

export function buildGrafanaEmbedUrl(panel: { embedPath: string; panelType: string }): string | null {
  if (panel.embedPath.startsWith("http://") || panel.embedPath.startsWith("https://")) {
    return panel.embedPath;
  }
  const base =
    process.env.GRAFANA_EMBED_BASE_URL?.trim() ||
    process.env.GRAFANA_LOCAL_URL?.trim() ||
    process.env.INTERNAL_GRAFANA_URL?.trim() ||
    getLogBackendStatus().grafanaLocalUrl;
  if (!base) return null;
  const root = base.replace(/\/+$/, "");
  const path = panel.embedPath.startsWith("/") ? panel.embedPath : `/${panel.embedPath}`;
  const params = new URLSearchParams({
    theme: "dark",
    kiosk: "tv",
  });
  if (panel.panelType === "explore") {
    return `${root}${path}`;
  }
  return `${root}${path}${path.includes("?") ? "&" : "?"}${params}`;
}

export async function listGrafanaPanels() {
  const configuredBase =
    process.env.GRAFANA_EMBED_BASE_URL?.trim() ||
    process.env.GRAFANA_LOCAL_URL?.trim() ||
    process.env.INTERNAL_GRAFANA_URL?.trim() ||
    getLogBackendStatus().grafanaLocalUrl;
  if (!configuredBase) return [];

  await ensureDefaultGrafanaPanels();
  const panels = await db
    .select()
    .from(internalOpsGrafanaPanelsTable)
    .where(eq(internalOpsGrafanaPanelsTable.enabled, true))
    .orderBy(internalOpsGrafanaPanelsTable.sortOrder);

  return panels.map((p) => ({
    ...p,
    embedUrl: buildGrafanaEmbedUrl(p),
  }));
}

export async function getMonitoringReport(): Promise<{
  generatedAt: string;
  uptime: { api: string; database: string; logSink: string };
  metrics: Record<string, number>;
  alertEvaluation: Awaited<ReturnType<typeof evaluateAlertRules>>;
  openFirings: Awaited<ReturnType<typeof listAlertFirings>>;
  logBackends: ReturnType<typeof getLogBackendStatus>;
  topErrorTypes: Array<{ type: string; count: number }>;
}> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [obs, alertEvaluation, openFirings, topErrors] = await Promise.all([
    getPlatformObservability(),
    evaluateAlertRules(),
    listAlertFirings(20, true),
    db
      .select({ type: eventsTable.type, count: sql<number>`count(*)::int` })
      .from(eventsTable)
      .where(and(gte(eventsTable.createdAt, dayAgo), eq(eventsTable.level, "ERROR")))
      .groupBy(eventsTable.type)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
  ]);

  const logBackends = getLogBackendStatus();

  return {
    generatedAt: new Date().toISOString(),
    uptime: {
      api: obs.database.ok ? "operational" : "degraded",
      database: obs.database.ok ? "operational" : "outage",
      logSink: logBackends.lokiPush ? "operational" : "not_configured",
    },
    metrics: alertEvaluation.metrics,
    alertEvaluation,
    openFirings,
    logBackends,
    topErrorTypes: topErrors.map((r) => ({ type: r.type, count: r.count })),
  };
}
