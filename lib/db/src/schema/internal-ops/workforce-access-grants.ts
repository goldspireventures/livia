import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const internalWorkforceAccessGrantsTable = pgTable(
  "internal_workforce_access_grants",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    tier: text("tier").notNull(),
    notes: text("notes"),
    grantedBy: text("granted_by").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedBy: text("revoked_by"),
  },
  (t) => [
    index("internal_workforce_access_grants_active_idx").on(t.grantedAt),
  ],
);

export const insertInternalWorkforceAccessGrantSchema = createInsertSchema(
  internalWorkforceAccessGrantsTable,
).omit({ id: true, grantedAt: true, revokedAt: true, revokedBy: true });

export type InternalWorkforceAccessGrant = typeof internalWorkforceAccessGrantsTable.$inferSelect;
