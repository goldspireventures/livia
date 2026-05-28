import { pgTable, text, timestamp, boolean, integer, jsonb, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";

/** Idempotent Stripe webhook event ledger — dedupe by event.id */
export const stripeEventsTable = pgTable(
  "stripe_events",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    livemode: boolean("livemode").notNull().default(false),
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "set null" }),
    payload: jsonb("payload"),
    processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("stripe_events_type_idx").on(t.type, t.createdAt),
    index("stripe_events_business_idx").on(t.businessId, t.createdAt),
  ],
);

/** Dead-letter queue for failed provider calls (Stripe, Twilio, Meta). */
export const providerDlqTable = pgTable(
  "provider_dlq",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    operation: text("operation").notNull(),
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "set null" }),
    payload: jsonb("payload"),
    error: text("error").notNull(),
    attempts: integer("attempts").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("provider_dlq_provider_idx").on(t.provider, t.createdAt)],
);

export type StripeEvent = typeof stripeEventsTable.$inferSelect;
export type ProviderDlqEntry = typeof providerDlqTable.$inferSelect;
