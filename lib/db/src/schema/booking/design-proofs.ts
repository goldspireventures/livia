import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";
import { customersTable } from "./customers";
import { bookingsTable } from "./bookings";

export const designProofAssetsTable = pgTable(
  "design_proof_assets",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customersTable.id, { onDelete: "set null" }),
    bookingId: text("booking_id").references(() => bookingsTable.id, { onDelete: "set null" }),
    status: text("status").notNull().default("draft"),
    imageUrl: text("image_url"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("design_proof_assets_business_idx").on(t.businessId, t.status)],
);

export type DesignProofAsset = typeof designProofAssetsTable.$inferSelect;
