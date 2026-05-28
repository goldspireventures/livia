import { pgTable, text, timestamp, integer, jsonb, bigserial, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";

/**
 * Append-only usage meters consumed by settlement + billing reports.
 * Mirrors @workspace/metering meter keys.
 */
export const usageEventsTable = pgTable(
  "usage_events",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    meterKey: text("meter_key").notNull(),
    quantity: integer("quantity").notNull().default(1),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("usage_events_business_meter_time_idx").on(
      t.businessId,
      t.meterKey,
      t.occurredAt,
    ),
    index("usage_events_business_time_idx").on(t.businessId, t.occurredAt),
  ],
);

export type UsageEvent = typeof usageEventsTable.$inferSelect;
export type InsertUsageEvent = typeof usageEventsTable.$inferInsert;
