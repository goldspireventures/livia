import { pgTable, text, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";
import { customersTable } from "./customers";
import { bookingsTable } from "./bookings";
import { servicesTable } from "./services";
import { staffTable } from "../identity/staff";

export const medspaConsentRecordsTable = pgTable(
  "medspa_consent_records",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customersTable.id, { onDelete: "cascade" }),
    bookingId: text("booking_id").references(() => bookingsTable.id, { onDelete: "set null" }),
    procedureCode: text("procedure_code").notNull(),
    procedureLabel: text("procedure_label").notNull(),
    consentVersion: text("consent_version").notNull(),
    status: text("status").notNull().default("pending"),
    signatureName: text("signature_name"),
    marketCode: text("market_code").notNull().default("IE"),
    metadata: jsonb("metadata"),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("medspa_consent_business_status_idx").on(t.businessId, t.status, t.createdAt)],
);

export const medicalIntakeRecordsTable = pgTable(
  "medical_intake_records",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customersTable.id, { onDelete: "cascade" }),
    bookingId: text("booking_id").references(() => bookingsTable.id, { onDelete: "set null" }),
    allergies: text("allergies"),
    medications: text("medications"),
    conditions: text("conditions"),
    priorProcedures: text("prior_procedures"),
    notes: text("notes"),
    status: text("status").notNull().default("draft"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("medical_intake_business_status_idx").on(t.businessId, t.status, t.createdAt)],
);

export const slotWaitlistEntriesTable = pgTable(
  "slot_waitlist_entries",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customersTable.id, { onDelete: "set null" }),
    serviceId: text("service_id").references(() => servicesTable.id, { onDelete: "set null" }),
    preferredStaffId: text("preferred_staff_id").references(() => staffTable.id, {
      onDelete: "set null",
    }),
    phone: text("phone"),
    email: text("email"),
    notes: text("notes"),
    status: text("status").notNull().default("active"),
    offeredBookingId: text("offered_booking_id").references(() => bookingsTable.id, {
      onDelete: "set null",
    }),
    offeredAt: timestamp("offered_at", { withTimezone: true }),
    offerToken: text("offer_token").unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("slot_waitlist_business_active_idx").on(t.businessId, t.status, t.createdAt)],
);

export type MedspaConsentRecord = typeof medspaConsentRecordsTable.$inferSelect;
export type MedicalIntakeRecord = typeof medicalIntakeRecordsTable.$inferSelect;
export type SlotWaitlistEntry = typeof slotWaitlistEntriesTable.$inferSelect;
