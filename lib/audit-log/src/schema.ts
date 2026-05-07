/**
 * Audit log schema — append-only, hash-chained per tenant.
 *
 * Per ADR 0015 + docs/engineering/audit-log-physical-design.md.
 *
 * Tampering with any row invalidates every subsequent row's hash for that tenant.
 * The `prev_hash` / `row_hash` columns implement the chain.
 *
 * INSERTs are computed via the `lib/audit-log` writer (which holds the
 * canonicalisation + chain logic). UPDATE/DELETE are blocked by Postgres
 * triggers (see lib/db/migrations/sql/001-rls-and-audit-guards.sql).
 */
import { pgTable, text, timestamp, jsonb, bigserial, customType, index } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return "bytea";
  },
});

export const auditLogTable = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    businessId: text("business_id").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    /** 'liv' | 'human' | 'system' */
    actorKind: text("actor_kind").notNull(),
    /** user_id (text/Clerk-id) or liv-runtime-instance-id */
    actorId: text("actor_id").notNull(),
    /** If impersonation, the user being acted-as. */
    onBehalfOfId: text("on_behalf_of_id"),
    /** e.g., 'liv.book' | 'liv.refund' | 'human.login' | 'human.refund.approve' */
    actionClass: text("action_class").notNull(),
    /** e.g., 'booking' | 'refund' | 'staff' | 'membership' */
    resourceKind: text("resource_kind").notNull(),
    resourceId: text("resource_id"),
    /** Structured detail; PII may be redacted in-place via a tombstone. */
    payload: jsonb("payload").notNull(),
    /** Hash of previous row for this business_id; first row uses zero-buffer. */
    prevHash: bytea("prev_hash").notNull(),
    /** sha256(prev_hash || canonical(payload + meta)) */
    rowHash: bytea("row_hash").notNull(),
  },
  (t) => [
    index("audit_log_tenant_time_idx").on(t.businessId, t.occurredAt),
    index("audit_log_resource_idx").on(t.resourceKind, t.resourceId),
    index("audit_log_action_idx").on(t.actionClass),
  ],
);

export type AuditLogRow = typeof auditLogTable.$inferSelect;
export type InsertAuditLog = typeof auditLogTable.$inferInsert;
