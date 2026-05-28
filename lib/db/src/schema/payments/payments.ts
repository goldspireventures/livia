import { pgTable, text, timestamp, boolean, integer, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { businessesTable } from "../identity/businesses";
import { customersTable } from "../booking/customers";
import { bookingsTable } from "../booking/bookings";

export const paymentProviderEnum = pgEnum("payment_provider", ["STRIPE", "MULAH"]);

export const paymentIntentStatusEnum = pgEnum("payment_intent_status", [
  "PENDING", "REQUIRES_ACTION", "PROCESSING", "SUCCEEDED", "FAILED", "CANCELLED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "SUCCEEDED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "DISPUTED",
]);

export const paymentAccountStatusEnum = pgEnum("payment_account_status", [
  "PENDING", "ACTIVE", "RESTRICTED", "DISABLED",
]);

export const refundStatusEnum = pgEnum("refund_status", [
  "PENDING", "SUCCEEDED", "FAILED", "CANCELLED",
]);

export const paymentAccountsTable = pgTable(
  "payment_accounts",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    provider: paymentProviderEnum("provider").notNull().default("STRIPE"),
    providerAccountId: text("provider_account_id"),
    status: paymentAccountStatusEnum("status").notNull().default("PENDING"),
    chargesEnabled: boolean("charges_enabled").notNull().default(false),
    payoutsEnabled: boolean("payouts_enabled").notNull().default(false),
    detailsSubmitted: boolean("details_submitted").notNull().default(false),
    onboardingUrl: text("onboarding_url"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payment_accounts_business_idx").on(t.businessId)],
);

export const paymentIntentRecordsTable = pgTable(
  "payment_intent_records",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customersTable.id, { onDelete: "set null" }),
    bookingId: text("booking_id").references(() => bookingsTable.id, { onDelete: "set null" }),
    provider: paymentProviderEnum("provider").notNull().default("STRIPE"),
    providerPaymentIntentId: text("provider_payment_intent_id"),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull().default("EUR"),
    status: paymentIntentStatusEnum("status").notNull().default("PENDING"),
    checkoutUrl: text("checkout_url"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("payment_intents_business_idx").on(t.businessId),
    index("payment_intents_booking_idx").on(t.bookingId),
  ],
);

export const paymentsTable = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customersTable.id, { onDelete: "set null" }),
    bookingId: text("booking_id").references(() => bookingsTable.id, { onDelete: "set null" }),
    paymentIntentId: text("payment_intent_id").references(() => paymentIntentRecordsTable.id),
    provider: paymentProviderEnum("provider").notNull().default("STRIPE"),
    providerChargeId: text("provider_charge_id"),
    amountMinor: integer("amount_minor").notNull(),
    platformFeeMinor: integer("platform_fee_minor"),
    netAmountMinor: integer("net_amount_minor"),
    currency: text("currency").notNull().default("EUR"),
    status: paymentStatusEnum("status").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("payments_business_idx").on(t.businessId),
    index("payments_booking_idx").on(t.bookingId),
  ],
);

export const refundsTable = pgTable(
  "refunds",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    paymentId: text("payment_id")
      .notNull()
      .references(() => paymentsTable.id),
    bookingId: text("booking_id").references(() => bookingsTable.id, { onDelete: "set null" }),
    providerRefundId: text("provider_refund_id"),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull().default("EUR"),
    reason: text("reason"),
    status: refundStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("refunds_business_idx").on(t.businessId),
    index("refunds_payment_idx").on(t.paymentId),
  ],
);

export const insertPaymentIntentSchema = createInsertSchema(paymentIntentRecordsTable).omit({ createdAt: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ createdAt: true, updatedAt: true });
export const insertRefundSchema = createInsertSchema(refundsTable).omit({ createdAt: true, updatedAt: true });
export type PaymentAccount = typeof paymentAccountsTable.$inferSelect;
export type PaymentIntentRecord = typeof paymentIntentRecordsTable.$inferSelect;
export type Payment = typeof paymentsTable.$inferSelect;
export type Refund = typeof refundsTable.$inferSelect;
