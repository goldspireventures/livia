import { pgTable, text, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "../identity/businesses";
import { bookingResourcesTable } from "./booking-resources";

export const servicesTable = pgTable(
  "services",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"),
    durationMinutes: integer("duration_minutes").notNull(),
    bufferBeforeMinutes: integer("buffer_before_minutes").notNull().default(0),
    bufferAfterMinutes: integer("buffer_after_minutes").notNull().default(0),
    priceMinor: integer("price_minor").notNull().default(0),
    currency: text("currency").notNull().default("EUR"),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    requiredResourceId: text("required_resource_id").references(() => bookingResourcesTable.id, {
      onDelete: "set null",
    }),
    serviceKind: text("service_kind"),
    rebookIntervalDays: integer("rebook_interval_days"),
    requiresPatchTest: boolean("requires_patch_test").notNull().default(false),
    aftercareInstructions: text("aftercare_instructions"),
    linkedRetailProductId: text("linked_retail_product_id"),
    /** Consult-first catalogue unit — flat, per_guest, per_table, per_item, per_metre */
    quoteUnit: text("quote_unit"),
    /** Event-vendor hire stock — warn when quote qty exceeds available units */
    stockCount: integer("stock_count"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("services_business_idx").on(t.businessId),
    index("services_active_idx").on(t.businessId, t.isActive),
  ],
);

export const insertServiceSchema = createInsertSchema(servicesTable).omit({ createdAt: true, updatedAt: true });
export const selectServiceSchema = createSelectSchema(servicesTable);
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof servicesTable.$inferSelect;
