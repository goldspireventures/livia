import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";
import { customersTable } from "./customers";

export const packageCreditLedgerTable = pgTable(
  "package_credit_ledger",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customersTable.id, { onDelete: "cascade" }),
    packageName: text("package_name").notNull(),
    creditsTotal: integer("credits_total").notNull(),
    creditsRemaining: integer("credits_remaining").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("package_credit_ledger_customer_idx").on(t.businessId, t.customerId)],
);

export type PackageCreditLedger = typeof packageCreditLedgerTable.$inferSelect;
