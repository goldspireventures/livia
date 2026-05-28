import { pgTable, text, timestamp, jsonb, boolean, integer, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const internalOpsAlertRulesTable = pgTable(
  "internal_ops_alert_rules",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    enabled: boolean("enabled").notNull().default(true),
    severity: text("severity").notNull().default("warn"),
    metricKey: text("metric_key").notNull(),
    operator: text("operator").notNull().default("gt"),
    threshold: numeric("threshold").notNull(),
    windowMinutes: integer("window_minutes").notNull().default(15),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("internal_ops_alert_rules_enabled_idx").on(t.enabled)],
);

export const internalOpsAlertFiringsTable = pgTable(
  "internal_ops_alert_firings",
  {
    id: text("id").primaryKey(),
    ruleId: text("rule_id")
      .notNull()
      .references(() => internalOpsAlertRulesTable.id, { onDelete: "cascade" }),
    firedAt: timestamp("fired_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    valueAtFire: numeric("value_at_fire").notNull(),
    message: text("message").notNull(),
    acknowledgedBy: text("acknowledged_by"),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    metadata: jsonb("metadata"),
  },
  (t) => [index("internal_ops_alert_firings_rule_idx").on(t.ruleId, t.firedAt)],
);

export const internalOpsSavedLogSearchesTable = pgTable(
  "internal_ops_saved_log_searches",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    backend: text("backend").notNull().default("platform"),
    queryJson: jsonb("query_json").notNull().default({}),
    createdBy: text("created_by"),
    pinned: boolean("pinned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export const internalOpsGrafanaPanelsTable = pgTable(
  "internal_ops_grafana_panels",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    panelType: text("panel_type").notNull().default("explore"),
    embedPath: text("embed_path").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export const insertInternalOpsAlertRuleSchema = createInsertSchema(internalOpsAlertRulesTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InternalOpsAlertRule = typeof internalOpsAlertRulesTable.$inferSelect;
export type InternalOpsAlertFiring = typeof internalOpsAlertFiringsTable.$inferSelect;
export type InternalOpsSavedLogSearch = typeof internalOpsSavedLogSearchesTable.$inferSelect;
export type InternalOpsGrafanaPanel = typeof internalOpsGrafanaPanelsTable.$inferSelect;

export const BUILTIN_ALERT_METRICS = [
  "db_latency_ms",
  "failed_notifications_24h",
  "failed_notifications_15m",
  "stuck_continuity",
  "events_error_15m",
  "events_warn_15m",
  "bookings_pending",
  "support_tickets_open",
  "conversations_open",
] as const;

export type BuiltinAlertMetric = (typeof BUILTIN_ALERT_METRICS)[number];

export const savedLogSearchQuerySchema = z.object({
  q: z.string().optional(),
  level: z.string().optional(),
  source: z.string().optional(),
  businessId: z.string().optional(),
  requestId: z.string().optional(),
  hours: z.number().optional(),
  logql: z.string().optional(),
  sql: z.string().optional(),
});
