import { pgTable, text, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";
import { staffTable } from "./staff";

export const availabilityRulesTable = pgTable(
  "availability_rules",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
    staffId: text("staff_id").references(() => staffTable.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0=Sun 6=Sat
    startTime: text("start_time").notNull(), // "HH:mm"
    endTime: text("end_time").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("avail_rules_business_idx").on(t.businessId),
    index("avail_rules_staff_idx").on(t.staffId),
    index("avail_rules_day_idx").on(t.businessId, t.dayOfWeek),
  ],
);

export const timeOffTable = pgTable(
  "time_off",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
    staffId: text("staff_id").references(() => staffTable.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("time_off_business_idx").on(t.businessId),
    index("time_off_staff_idx").on(t.staffId),
    index("time_off_range_idx").on(t.startsAt, t.endsAt),
  ],
);

export const insertAvailabilityRuleSchema = createInsertSchema(availabilityRulesTable).omit({ createdAt: true, updatedAt: true });
export const selectAvailabilityRuleSchema = createSelectSchema(availabilityRulesTable);
export const insertTimeOffSchema = createInsertSchema(timeOffTable).omit({ createdAt: true, updatedAt: true });
export const selectTimeOffSchema = createSelectSchema(timeOffTable);
export type InsertAvailabilityRule = z.infer<typeof insertAvailabilityRuleSchema>;
export type AvailabilityRule = typeof availabilityRulesTable.$inferSelect;
export type InsertTimeOff = z.infer<typeof insertTimeOffSchema>;
export type TimeOff = typeof timeOffTable.$inferSelect;
