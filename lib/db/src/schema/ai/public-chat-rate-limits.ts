import { pgTable, text, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";

/**
 * DB-backed rate limits for unauthenticated public Liv chat (per IP).
 * Replaces in-memory buckets so multi-instance api-server stays consistent.
 */
export const publicChatRateLimitsTable = pgTable(
  "public_chat_rate_limits",
  {
    ipKey: text("ip_key").notNull(),
    window: text("window").notNull(), // "5m" | "1h"
    count: integer("count").notNull().default(0),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.ipKey, t.window] })],
);
