import { jsonb, pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

export const execWorkEventsTable = pgTable(
  "exec_work_events",
  {
    id: text("id").primaryKey(),
    hatId: text("hat_id").notNull(),
    summary: text("summary").notNull(),
    actor: text("actor").notNull(),
    actorLabel: text("actor_label"),
    links: jsonb("links").notNull().default([]),
    sessionId: text("session_id"),
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("exec_work_events_hat_created_idx").on(t.hatId, t.createdAt),
    index("exec_work_events_created_idx").on(t.createdAt),
  ],
);

export type ExecWorkEvent = typeof execWorkEventsTable.$inferSelect;
