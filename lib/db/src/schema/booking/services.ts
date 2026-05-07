import { pgTable, text, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "../identity/businesses";

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
    currency: text("currency").notNull().default("GBP"),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
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
