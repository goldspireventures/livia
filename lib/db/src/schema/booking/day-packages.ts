import { pgTable, text, timestamp, boolean, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";
import { servicesTable } from "./services";
import { bookingResourcesTable } from "./booking-resources";
import { staffTable } from "../identity/staff";

export const dayPackagesTable = pgTable(
  "day_packages",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    totalDurationMinutes: integer("total_duration_minutes").notNull(),
    priceMinor: integer("price_minor").notNull().default(0),
    currency: text("currency").notNull().default("EUR"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("day_packages_business_idx").on(t.businessId, t.isActive)],
);

export const dayPackageStepsTable = pgTable(
  "day_package_steps",
  {
    id: text("id").primaryKey(),
    packageId: text("package_id")
      .notNull()
      .references(() => dayPackagesTable.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    serviceId: text("service_id")
      .notNull()
      .references(() => servicesTable.id, { onDelete: "restrict" }),
    resourceId: text("resource_id").references(() => bookingResourcesTable.id, {
      onDelete: "set null",
    }),
    staffId: text("staff_id").references(() => staffTable.id, { onDelete: "set null" }),
    durationMinutes: integer("duration_minutes").notNull(),
    bufferAfterMinutes: integer("buffer_after_minutes").notNull().default(15),
    label: text("label"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("day_package_steps_seq_idx").on(t.packageId, t.sequence)],
);

export type DayPackage = typeof dayPackagesTable.$inferSelect;
export type DayPackageStep = typeof dayPackageStepsTable.$inferSelect;
