import { pgTable, text, timestamp, integer, boolean, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { businessesTable } from "../identity/businesses";
import { usersTable } from "../identity/users";

export const aiObservationStatusEnum = pgEnum("ai_observation_status", [
  "NEW", "REVIEWED", "DISMISSED", "ESCALATED",
]);

export const incidentStatusEnum = pgEnum("incident_status", [
  "OPEN", "INVESTIGATING", "MITIGATED", "RESOLVED", "CLOSED",
]);

export const incidentCategoryEnum = pgEnum("incident_category", [
  "BOOKING_FAILURE", "NOTIFICATION_FAILURE", "AUTH_FAILURE",
  "INTEGRATION_FAILURE", "DATA_CONSISTENCY_RISK", "AVAILABILITY_ANOMALY",
  "CONFIGURATION_RISK", "OTHER",
]);

export const remediationActionStatusEnum = pgEnum("remediation_action_status", [
  "PROPOSED", "APPROVED", "REJECTED", "EXECUTING", "SUCCEEDED", "FAILED", "CANCELLED",
]);

export const knowledgeScopeEnum = pgEnum("knowledge_scope", [
  "PRODUCT", "OPERATIONS", "CUSTOMER_BEHAVIOR", "INCIDENT_RESPONSE", "GLOBAL",
]);

export const aiInteractionsTable = pgTable(
  "ai_interactions",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    module: text("module").notNull(),
    purpose: text("purpose").notNull(),
    model: text("model"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    latencyMs: integer("latency_ms"),
    success: boolean("success").notNull().default(true),
    errorMessage: text("error_message"),
    context: jsonb("context"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ai_interactions_business_idx").on(t.businessId),
    index("ai_interactions_module_idx").on(t.module),
    index("ai_interactions_created_at_idx").on(t.createdAt),
  ],
);

export const aiObservationsTable = pgTable(
  "ai_observations",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    module: text("module").notNull(),
    status: aiObservationStatusEnum("status").notNull().default("NEW"),
    severity: text("severity").notNull().default("LOW"),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    context: jsonb("context"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ai_obs_business_idx").on(t.businessId),
    index("ai_obs_status_idx").on(t.status),
    index("ai_obs_created_at_idx").on(t.createdAt),
  ],
);

export const incidentsTable = pgTable(
  "incidents",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary"),
    category: incidentCategoryEnum("category").notNull(),
    status: incidentStatusEnum("status").notNull().default("OPEN"),
    severity: text("severity").notNull().default("MEDIUM"),
    observationId: text("observation_id").references(() => aiObservationsTable.id),
    likelyCause: text("likely_cause"),
    suggestedSteps: jsonb("suggested_steps"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    context: jsonb("context"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("incidents_business_idx").on(t.businessId),
    index("incidents_status_idx").on(t.status),
    index("incidents_created_at_idx").on(t.createdAt),
  ],
);

export const remediationActionsTable = pgTable(
  "remediation_actions",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
    incidentId: text("incident_id").references(() => incidentsTable.id, { onDelete: "set null" }),
    observationId: text("observation_id").references(() => aiObservationsTable.id),
    proposedBy: text("proposed_by").notNull(),
    status: remediationActionStatusEnum("status").notNull().default("PROPOSED"),
    title: text("title").notNull(),
    description: text("description"),
    approvedByUserId: text("approved_by_user_id").references(() => usersTable.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    executedAt: timestamp("executed_at", { withTimezone: true }),
    resultSummary: text("result_summary"),
    context: jsonb("context"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("remediation_business_idx").on(t.businessId),
    index("remediation_incident_idx").on(t.incidentId),
  ],
);

export const knowledgeEntriesTable = pgTable(
  "knowledge_entries",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
    scope: knowledgeScopeEnum("scope").notNull().default("OPERATIONS"),
    title: text("title").notNull(),
    content: text("content").notNull(),
    sourceType: text("source_type").notNull(),
    sourceRef: text("source_ref"),
    tags: text("tags").array(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("knowledge_business_idx").on(t.businessId),
    index("knowledge_scope_idx").on(t.scope),
  ],
);

export const insertAIInteractionSchema = createInsertSchema(aiInteractionsTable).omit({ createdAt: true });
export const insertAIObservationSchema = createInsertSchema(aiObservationsTable).omit({ createdAt: true, updatedAt: true });
export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({ createdAt: true, updatedAt: true });
export const insertRemediationSchema = createInsertSchema(remediationActionsTable).omit({ createdAt: true, updatedAt: true });
export const insertKnowledgeEntrySchema = createInsertSchema(knowledgeEntriesTable).omit({ createdAt: true, updatedAt: true });

export type AIInteraction = typeof aiInteractionsTable.$inferSelect;
export type AIObservation = typeof aiObservationsTable.$inferSelect;
export type Incident = typeof incidentsTable.$inferSelect;
export type RemediationAction = typeof remediationActionsTable.$inferSelect;
export type KnowledgeEntry = typeof knowledgeEntriesTable.$inferSelect;
