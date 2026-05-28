import { pgTable, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";
import { usersTable } from "../identity/users";

export const livActionProposalsTable = pgTable(
  "liv_action_proposals",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    status: text("status").notNull().default("pending"),
    outcomePreview: text("outcome_preview"),
    reason: text("reason"),
    valueMinor: integer("value_minor").notNull().default(0),
    resourceKind: text("resource_kind"),
    resourceId: text("resource_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    proposedBy: text("proposed_by").notNull().default("liv"),
    resolvedBy: text("resolved_by").references(() => usersTable.id, { onDelete: "set null" }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("liv_action_proposals_business_status_idx").on(t.businessId, t.status, t.createdAt),
  ],
);
