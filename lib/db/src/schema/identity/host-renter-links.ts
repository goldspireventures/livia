import { pgTable, text, timestamp, integer, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";

/** Chair-rental host ↔ independent renter business (separate tenant). Host API never exposes renter CRM. */
export const hostRenterLinksTable = pgTable(
  "host_renter_links",
  {
    id: text("id").primaryKey(),
    hostBusinessId: text("host_business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    renterBusinessId: text("renter_business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    chairLabel: text("chair_label").notNull(),
    weeklyRentMinor: integer("weekly_rent_minor").notNull().default(0),
    currency: text("currency").notNull().default("EUR"),
    /** due | paid | waived */
    rentStatus: text("rent_status").notNull().default("due"),
    isActive: boolean("is_active").notNull().default(true),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    portabilityExportedAt: timestamp("portability_exported_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("host_renter_unique_idx").on(t.hostBusinessId, t.renterBusinessId),
    index("host_renter_host_idx").on(t.hostBusinessId),
    index("host_renter_renter_idx").on(t.renterBusinessId),
  ],
);

export type HostRenterLink = typeof hostRenterLinksTable.$inferSelect;
