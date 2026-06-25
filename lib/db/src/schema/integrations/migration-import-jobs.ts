import { pgTable, text, timestamp, jsonb, integer, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";

export const migrationImportJobsTable = pgTable(
  "migration_import_jobs",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("queued"),
    mode: text("mode").notNull(),
    sourceId: text("source_id").notNull(),
    totalImported: integer("total_imported").notNull().default(0),
    results: jsonb("results").notNull().default([]),
    message: text("message").notNull().default(""),
    error: text("error"),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("migration_import_jobs_business_idx").on(t.businessId, t.createdAt)],
);
