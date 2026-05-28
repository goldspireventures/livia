import { pgTable, text, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { businessesTable } from "../identity/businesses";
import { usersTable } from "../identity/users";

/** Tenant or partner API keys (scoped capability tokens). */
export const apiCredentialsTable = pgTable(
  "api_credentials",
  {
    id: text("id").primaryKey(),
    /** null = platform partner key; set = tenant-scoped key for one shop */
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    scopes: jsonb("scopes").$type<string[]>().notNull().default([]),
    /** Partner keys: restrict to these slugs; empty = all shops */
    allowedSlugs: jsonb("allowed_slugs").$type<string[]>().default([]),
    createdByUserId: text("created_by_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("api_credentials_prefix_idx").on(t.keyPrefix),
    index("api_credentials_business_idx").on(t.businessId),
  ],
);

export const insertApiCredentialSchema = createInsertSchema(apiCredentialsTable);
export const selectApiCredentialSchema = createSelectSchema(apiCredentialsTable);
