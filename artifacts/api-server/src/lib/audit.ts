import { db, auditLogTable } from "@workspace/db";
import {
  auditEventInputSchema,
  genesisHash,
  type AuditEventInput,
  type ActorKind,
} from "@workspace/audit-log";
import { desc, eq } from "drizzle-orm";
import { logger } from "./logger";

const GENESIS = genesisHash();

export type AuditActor = {
  kind: ActorKind;
  id: string;
  onBehalfOfId?: string | null;
};

/**
 * Append one hash-chained audit row for a tenant.
 * Postgres triggers recompute prev_hash/row_hash as the second line of defence.
 */
export async function appendAudit(input: AuditEventInput): Promise<void> {
  const parsed = auditEventInputSchema.parse(input);
  try {
    await db.insert(auditLogTable).values({
      businessId: parsed.businessId,
      actorKind: parsed.actorKind,
      actorId: parsed.actorId,
      onBehalfOfId: parsed.onBehalfOfId ?? null,
      actionClass: parsed.actionClass,
      resourceKind: parsed.resourceKind,
      resourceId: parsed.resourceId ?? null,
      payload: parsed.payload,
      prevHash: GENESIS,
      rowHash: GENESIS,
    });
  } catch (err) {
    logger.error({ err, businessId: parsed.businessId, actionClass: parsed.actionClass }, "audit append failed");
    throw err;
  }
}

export async function appendHumanAudit(
  businessId: string,
  actorUserId: string,
  actionClass: string,
  resourceKind: string,
  resourceId: string | null,
  payload: Record<string, unknown>,
  onBehalfOfId?: string | null,
): Promise<void> {
  await appendAudit({
    businessId,
    actorKind: "human",
    actorId: actorUserId,
    onBehalfOfId: onBehalfOfId ?? null,
    actionClass,
    resourceKind,
    resourceId,
    payload,
  });
}

/** Load chain for a tenant ordered oldest-first (for verification). */
export async function listAuditChainForBusiness(businessId: string) {
  const rows = await db
    .select()
    .from(auditLogTable)
    .where(eq(auditLogTable.businessId, businessId))
    .orderBy(auditLogTable.id);
  return rows;
}

/** Newest row hash for a tenant (chain tail). */
export async function getAuditChainTail(businessId: string): Promise<Buffer | null> {
  const [row] = await db
    .select({ rowHash: auditLogTable.rowHash })
    .from(auditLogTable)
    .where(eq(auditLogTable.businessId, businessId))
    .orderBy(desc(auditLogTable.id))
    .limit(1);
  return row?.rowHash ?? null;
}
