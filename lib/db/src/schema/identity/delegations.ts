/**
 * Delegations — owner-on-holiday, shift handoffs, scoped time-bound authority.
 *
 * Per ADR 0009 + docs/engineering/data-model.md.
 *
 * A delegation says: "membership X grants membership Y the following caps,
 * within the following scope, until time T". The capability-tokens package
 * issues short-lived tokens against these on each request.
 */
import { pgTable, text, timestamp, jsonb, integer, pgEnum, index } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";
import { businessMembershipsTable } from "./businesses";

export const delegationStatusEnum = pgEnum("delegation_status", [
  "ACTIVE", "REVOKED", "EXPIRED",
]);

export const delegationsTable = pgTable(
  "delegations",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    granterMembershipId: text("granter_membership_id")
      .notNull()
      .references(() => businessMembershipsTable.id, { onDelete: "cascade" }),
    granteeMembershipId: text("grantee_membership_id")
      .notNull()
      .references(() => businessMembershipsTable.id, { onDelete: "cascade" }),
    // Caps mirror the membership cap shape (refund EUR, time-off days).
    capRefundEurCents: integer("cap_refund_eur_cents"),
    capTimeoffDays: integer("cap_timeoff_days"),
    // Scope: optional narrowing within the granter's own scope.
    scope: jsonb("scope"),
    reason: text("reason"),
    status: delegationStatusEnum("status").notNull().default("ACTIVE"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("delegations_business_idx").on(t.businessId),
    index("delegations_granter_idx").on(t.granterMembershipId),
    index("delegations_grantee_idx").on(t.granteeMembershipId),
    index("delegations_status_idx").on(t.businessId, t.status),
    index("delegations_active_window_idx").on(t.businessId, t.startsAt, t.endsAt),
  ],
);

export type Delegation = typeof delegationsTable.$inferSelect;
export type InsertDelegation = typeof delegationsTable.$inferInsert;
