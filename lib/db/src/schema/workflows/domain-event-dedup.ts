import { pgTable, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";

/** Idempotent domain-event publish ledger (ADR 0013). */
export const domainEventDedupTable = pgTable(
  "domain_event_dedup",
  {
    dedupeKey: text("dedupe_key").primaryKey(),
    eventName: text("event_name").notNull(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("domain_event_dedup_business_idx").on(t.businessId),
    uniqueIndex("domain_event_dedup_key_idx").on(t.dedupeKey),
  ],
);

export const workflowPausesTable = pgTable(
  "workflow_pauses",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    workflowId: text("workflow_id").notNull(),
    reason: text("reason").notNull(),
    pausedAt: timestamp("paused_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [
    index("workflow_pauses_business_idx").on(t.businessId),
    index("workflow_pauses_open_idx").on(t.businessId, t.resolvedAt),
  ],
);
