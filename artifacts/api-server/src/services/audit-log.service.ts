import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { auditLogTable, db } from "@workspace/db";

export type AuditLogSearchResult = {
  id: string;
  businessId: string;
  occurredAt: string;
  actorKind: string;
  actorId: string;
  onBehalfOfId: string | null;
  actionClass: string;
  resourceKind: string;
  resourceId: string | null;
  payload: Record<string, unknown>;
};

export async function searchAuditLog(
  businessId: string,
  opts: {
    q?: string;
    actionClass?: string;
    resourceKind?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  },
): Promise<{ data: AuditLogSearchResult[]; total: number }> {
  const { q, actionClass, resourceKind, from, to, limit = 50, offset = 0 } = opts;
  const conditions = [eq(auditLogTable.businessId, businessId)];

  if (actionClass) {
    conditions.push(eq(auditLogTable.actionClass, actionClass));
  }
  if (resourceKind) {
    conditions.push(eq(auditLogTable.resourceKind, resourceKind));
  }
  if (from) {
    conditions.push(gte(auditLogTable.occurredAt, new Date(from)));
  }
  if (to) {
    conditions.push(lte(auditLogTable.occurredAt, new Date(to)));
  }
  if (q?.trim()) {
    const pattern = `%${q.trim().replace(/%/g, "\\%")}%`;
    conditions.push(
      or(
        ilike(auditLogTable.actionClass, pattern),
        ilike(auditLogTable.resourceKind, pattern),
        ilike(auditLogTable.actorId, pattern),
        sql`${auditLogTable.payload}::text ilike ${pattern}`,
      )!,
    );
  }

  const whereClause = and(...conditions);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditLogTable)
    .where(whereClause);

  const rows = await db
    .select()
    .from(auditLogTable)
    .where(whereClause)
    .orderBy(desc(auditLogTable.occurredAt))
    .limit(limit)
    .offset(offset);

  return {
    total: countRow?.count ?? 0,
    data: rows.map((r) => ({
      id: String(r.id),
      businessId: r.businessId,
      occurredAt: r.occurredAt.toISOString(),
      actorKind: r.actorKind,
      actorId: r.actorId,
      onBehalfOfId: r.onBehalfOfId,
      actionClass: r.actionClass,
      resourceKind: r.resourceKind,
      resourceId: r.resourceId,
      payload: (r.payload ?? {}) as Record<string, unknown>,
    })),
  };
}
