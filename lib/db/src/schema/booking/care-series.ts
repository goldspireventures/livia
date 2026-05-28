import { pgTable, text, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";
import { customersTable } from "./customers";
import { servicesTable } from "./services";
import { staffTable } from "../identity/staff";
import { bookingsTable } from "./bookings";

export const careSeriesTable = pgTable(
  "care_series",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customersTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    serviceId: text("service_id")
      .notNull()
      .references(() => servicesTable.id, { onDelete: "restrict" }),
    preferredStaffId: text("preferred_staff_id").references(() => staffTable.id, {
      onDelete: "set null",
    }),
    sessionsTotal: integer("sessions_total").notNull(),
    sessionsCompleted: integer("sessions_completed").notNull().default(0),
    cadenceDays: integer("cadence_days").notNull().default(14),
    status: text("status").notNull().default("active"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("care_series_customer_idx").on(t.businessId, t.customerId)],
);

export const careSeriesSessionsTable = pgTable(
  "care_series_sessions",
  {
    id: text("id").primaryKey(),
    seriesId: text("series_id")
      .notNull()
      .references(() => careSeriesTable.id, { onDelete: "cascade" }),
    bookingId: text("booking_id").references(() => bookingsTable.id, { onDelete: "set null" }),
    sessionNumber: integer("session_number").notNull(),
    status: text("status").notNull().default("scheduled"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("care_series_sessions_num_idx").on(t.seriesId, t.sessionNumber)],
);

export type CareSeries = typeof careSeriesTable.$inferSelect;
export type CareSeriesSession = typeof careSeriesSessionsTable.$inferSelect;
