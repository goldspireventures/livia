import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";
import { usersTable } from "./users";

export const staffTable = pgTable(
  "staff",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    displayName: text("display_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    photoUrl: text("photo_url"),
    bio: text("bio"),
    color: text("color"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("staff_business_idx").on(t.businessId),
    index("staff_user_idx").on(t.userId),
    index("staff_active_idx").on(t.businessId, t.isActive),
  ],
);

export const staffServicesTable = pgTable(
  "staff_services",
  {
    staffId: text("staff_id")
      .notNull()
      .references(() => staffTable.id, { onDelete: "cascade" }),
    serviceId: text("service_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("staff_services_staff_idx").on(t.staffId),
    index("staff_services_service_idx").on(t.serviceId),
  ],
);

export const insertStaffSchema = createInsertSchema(staffTable).omit({ createdAt: true, updatedAt: true });
export const selectStaffSchema = createSelectSchema(staffTable);
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staffTable.$inferSelect;
