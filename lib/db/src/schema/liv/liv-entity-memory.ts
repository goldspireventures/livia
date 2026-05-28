import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";

export const livEntityMemoryTable = pgTable(
  "liv_entity_memory",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    kind: text("kind").notNull().default("note"),
    content: text("content").notNull(),
    createdBy: text("created_by").notNull().default("staff"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => [
    index("liv_entity_memory_entity_idx").on(t.businessId, t.entityType, t.entityId),
  ],
);

export type LivEntityMemory = typeof livEntityMemoryTable.$inferSelect;
