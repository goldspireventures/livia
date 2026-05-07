import { pgTable, text, timestamp, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "../identity/businesses";

export const featureFlagsTable = pgTable(
  "feature_flags",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
    description: text("description"),
    isEnabled: boolean("is_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("feature_flags_key_business_idx").on(t.key, t.businessId),
    index("feature_flags_key_idx").on(t.key),
  ],
);

export const insertFeatureFlagSchema = createInsertSchema(featureFlagsTable).omit({ createdAt: true, updatedAt: true });
export const selectFeatureFlagSchema = createSelectSchema(featureFlagsTable);
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type FeatureFlag = typeof featureFlagsTable.$inferSelect;

export const FeatureFlagKey = {
  PUBLIC_BOOKING_ENABLED: "public_booking_enabled",
  PAYMENTS_ENABLED: "payments_enabled",
  AI_INSIGHTS_ENABLED: "ai_insights_enabled",
  MESSAGING_INTEGRATIONS_ENABLED: "messaging_integrations_enabled",
  DEPOSITS_ENABLED: "deposits_enabled",
} as const;
