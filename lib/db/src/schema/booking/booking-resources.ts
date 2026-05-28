import { pgTable, text, timestamp, boolean, integer, pgEnum, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";

export const bookingResourceTypeEnum = pgEnum("booking_resource_type", [
  "room",
  "equipment",
  "thermal",
]);

export const bookingResourcesTable = pgTable(
  "booking_resources",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    resourceType: bookingResourceTypeEnum("resource_type").notNull().default("room"),
    capacity: integer("capacity").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("booking_resources_business_idx").on(t.businessId, t.isActive)],
);

export type BookingResource = typeof bookingResourcesTable.$inferSelect;
