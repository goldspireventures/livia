import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";

export const staffShiftsTable = pgTable(
  "staff_shifts",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    staffId: text("staff_id").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    label: text("label"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("staff_shifts_business_idx").on(t.businessId),
    index("staff_shifts_staff_idx").on(t.staffId),
  ],
);

export type StaffShift = typeof staffShiftsTable.$inferSelect;
