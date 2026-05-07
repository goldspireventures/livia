/**
 * time_off_requests — workflow on top of time-off.
 *
 * Per ADR 0009 (delegations + caps), F4 (Liv proposes, owner approves).
 * The actual time-off block lives in availability/time-off; this is the
 * proposal/review/approval ledger.
 */
import { pgTable, text, timestamp, integer, pgEnum, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";
import { staffTable } from "../identity/staff";
import { businessMembershipsTable } from "../identity/businesses";

export const timeOffRequestStatusEnum = pgEnum("time_off_request_status", [
  "PROPOSED", "PENDING_APPROVAL", "APPROVED", "REJECTED", "AUTO_APPROVED", "WITHDRAWN", "ESCALATED",
]);

export const timeOffRequestKindEnum = pgEnum("time_off_request_kind", [
  "annual_leave", "sick", "training", "personal", "bereavement", "parental", "block",
]);

export const timeOffRequestsTable = pgTable(
  "time_off_requests",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    staffId: text("staff_id")
      .notNull()
      .references(() => staffTable.id, { onDelete: "cascade" }),
    requestedByMembershipId: text("requested_by_membership_id").references(
      () => businessMembershipsTable.id,
      { onDelete: "set null" },
    ),
    kind: timeOffRequestKindEnum("kind").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    durationDays: integer("duration_days"),
    reason: text("reason"),
    status: timeOffRequestStatusEnum("status").notNull().default("PROPOSED"),
    // Who decided. Null means Liv proposed but no human has reviewed yet.
    decidedByMembershipId: text("decided_by_membership_id").references(
      () => businessMembershipsTable.id,
      { onDelete: "set null" },
    ),
    decisionNote: text("decision_note"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    // Cap consumed at decision time, in days. For audit on cap-ladder enforcement.
    capConsumedDays: integer("cap_consumed_days"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("time_off_requests_business_idx").on(t.businessId),
    index("time_off_requests_staff_idx").on(t.staffId),
    index("time_off_requests_status_idx").on(t.businessId, t.status),
    index("time_off_requests_window_idx").on(t.businessId, t.startAt, t.endAt),
  ],
);

export type TimeOffRequest = typeof timeOffRequestsTable.$inferSelect;
export type InsertTimeOffRequest = typeof timeOffRequestsTable.$inferInsert;
