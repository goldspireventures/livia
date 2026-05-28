import { pgTable, text, timestamp, integer, boolean, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";

export const franchiseLinksTable = pgTable(
  "franchise_links",
  {
    id: text("id").primaryKey(),
    franchisorBusinessId: text("franchisor_business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    franchiseeBusinessId: text("franchisee_business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    royaltyBps: integer("royalty_bps").notNull().default(500),
    isActive: boolean("is_active").notNull().default(true),
    policyPackOverride: jsonb("policy_pack_override").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("franchise_links_pair_idx").on(t.franchisorBusinessId, t.franchiseeBusinessId),
  ],
);

export type FranchiseLink = typeof franchiseLinksTable.$inferSelect;
