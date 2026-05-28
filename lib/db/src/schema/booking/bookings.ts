import { pgTable, text, timestamp, integer, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "../identity/businesses";
import { staffTable } from "../identity/staff";
import { servicesTable } from "./services";
import { customersTable, channelTypeEnum } from "./customers";
import { bookingResourcesTable } from "./booking-resources";

export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW",
]);

// Provenance — who/what brought this booking in. Drives outcome-share settlement.
export const bookingSourceEnum = pgEnum("booking_source", [
  "voice",
  "whatsapp",
  "sms",
  "instagram",
  "messenger",
  "email",
  "web",
  "owner-manual",
  "walk-in",
  "google-cal-import",
]);

export const bookingsTable = pgTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    staffId: text("staff_id").references(() => staffTable.id, { onDelete: "set null" }),
    resourceId: text("resource_id").references(() => bookingResourcesTable.id, {
      onDelete: "set null",
    }),
    serviceId: text("service_id")
      .notNull()
      .references(() => servicesTable.id, { onDelete: "restrict" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customersTable.id, { onDelete: "restrict" }),
    channelType: channelTypeEnum("channel_type").notNull().default("WEB"),
    // Composable monetisation: source provenance for settlement (voice 4% capped, etc).
    source: bookingSourceEnum("source").notNull().default("web"),
    // If source = voice/whatsapp/sms/instagram/email, link to the conversation.
    sourceConversationId: text("source_conversation_id"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    status: bookingStatusEnum("status").notNull().default("PENDING"),
    /** Machine reason while status=PENDING (e.g. AWAITING_DEPOSIT). */
    pendingReason: text("pending_reason"),
    continuityConversationId: text("continuity_conversation_id"),
    continuitySentAt: timestamp("continuity_sent_at", { withTimezone: true }),
    notes: text("notes"),
    internalNotes: text("internal_notes"),
    cancellationReason: text("cancellation_reason"),
    // Money on the booking — denormalised for fast settlement reads.
    depositPaidEurCents: integer("deposit_paid_eur_cents").notNull().default(0),
    totalPaidEurCents: integer("total_paid_eur_cents").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("bookings_business_idx").on(t.businessId),
    index("bookings_staff_idx").on(t.staffId),
    index("bookings_customer_idx").on(t.customerId),
    index("bookings_start_at_idx").on(t.businessId, t.startAt),
    index("bookings_status_idx").on(t.businessId, t.status),
    index("bookings_source_idx").on(t.businessId, t.source),
    index("bookings_source_conversation_idx").on(t.sourceConversationId),
  ],
);

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ createdAt: true, updatedAt: true });
export const selectBookingSchema = createSelectSchema(bookingsTable);
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;

export const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
};

export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
