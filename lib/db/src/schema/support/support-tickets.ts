import { pgTable, text, timestamp, jsonb, index, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "../identity/businesses";
import { usersTable } from "../identity/users";

export const supportTicketCategoryEnum = pgEnum("support_ticket_category", [
  "bug",
  "billing",
  "liv_error",
  "feature",
  "other",
]);

export const supportTicketSeverityEnum = pgEnum("support_ticket_severity", [
  "blocking",
  "annoying",
  "nice_to_have",
]);

export const supportTicketStatusEnum = pgEnum("support_ticket_status", [
  "open",
  "triaged",
  "resolved",
  "closed",
]);

export const supportTicketsTable = pgTable(
  "support_tickets",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    category: supportTicketCategoryEnum("category").notNull(),
    severity: supportTicketSeverityEnum("severity").notNull().default("annoying"),
    description: text("description").notNull(),
    status: supportTicketStatusEnum("status").notNull().default("open"),
    /** Livia Inc operator email (internal portal). */
    assignedTo: text("assigned_to"),
    internalNotes: jsonb("internal_notes")
      .$type<Array<{ at: string; by: string; body: string }>>()
      .notNull()
      .default([]),
    triagedAt: timestamp("triaged_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    /** Auto-attached: route, app version, bookingId, etc. */
    context: jsonb("context").$type<Record<string, unknown>>().default({}),
    consentLogsAccess: text("consent_logs_access").notNull().default("false"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("support_tickets_business_idx").on(t.businessId),
    index("support_tickets_status_idx").on(t.businessId, t.status),
    index("support_tickets_created_idx").on(t.createdAt),
  ],
);

export const insertSupportTicketSchema = createInsertSchema(supportTicketsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const selectSupportTicketSchema = createSelectSchema(supportTicketsTable);
export type SupportTicket = typeof supportTicketsTable.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
