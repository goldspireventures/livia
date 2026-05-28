import { pgTable, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";
import { bookingsTable } from "./bookings";
import { conversationsTable } from "../conversations/conversations";

export const shiftTemplatesTable = pgTable(
  "shift_templates",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    label: text("label"),
    roleHint: text("role_hint"),
    minStaff: integer("min_staff").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("shift_templates_business_idx").on(t.businessId)],
);

export const refundLedgerTable = pgTable(
  "refund_ledger",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    bookingId: text("booking_id").references(() => bookingsTable.id, { onDelete: "set null" }),
    conversationId: text("conversation_id").references(() => conversationsTable.id, {
      onDelete: "set null",
    }),
    proposalId: text("proposal_id"),
    amountMinor: integer("amount_minor").notNull(),
    status: text("status").notNull().default("processed"),
    providerRef: text("provider_ref"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("refund_ledger_business_idx").on(t.businessId, t.createdAt)],
);

export type ShiftTemplate = typeof shiftTemplatesTable.$inferSelect;
export type RefundLedgerEntry = typeof refundLedgerTable.$inferSelect;
