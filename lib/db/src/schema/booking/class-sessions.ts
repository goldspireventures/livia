import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";
import { servicesTable } from "./services";
import { staffTable } from "../identity/staff";
import { customersTable } from "./customers";

export const classSessionsTable = pgTable(
  "class_sessions",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    serviceId: text("service_id").references(() => servicesTable.id, { onDelete: "set null" }),
    staffId: text("staff_id").references(() => staffTable.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    capacity: integer("capacity").notNull().default(10),
    waitlistCapacity: integer("waitlist_capacity").notNull().default(5),
    status: text("status").notNull().default("scheduled"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("class_sessions_business_starts_idx").on(t.businessId, t.startsAt)],
);

export const classEnrollmentsTable = pgTable(
  "class_enrollments",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => classSessionsTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customersTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("enrolled"),
    waitlistPosition: integer("waitlist_position"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("class_enrollments_session_idx").on(t.sessionId)],
);

export type ClassSession = typeof classSessionsTable.$inferSelect;
export type ClassEnrollment = typeof classEnrollmentsTable.$inferSelect;
