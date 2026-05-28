import { pgTable, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";

export const livSignalsTable = pgTable(
  "liv_signals",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    priority: text("priority").notNull().default("info"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    eventName: text("event_name"),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    dedupeKey: text("dedupe_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("liv_signals_dedupe_idx").on(t.dedupeKey),
    index("liv_signals_business_created_idx").on(t.businessId, t.createdAt),
  ],
);

export type LivSignalRow = typeof livSignalsTable.$inferSelect;
