import { db, livSignalsTable, bookingsTable, conversationsTable } from "@workspace/db";
import { and, eq, gte, isNull, desc } from "drizzle-orm";
import { generateId } from "../lib/id";
import type { LivSignalPriority } from "@workspace/liv-runtime";

export type LivMoment = {
  id: string;
  kind: string;
  priority: LivSignalPriority;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  href: string | null;
};

function hrefForEntity(
  entityType: string | null,
  entityId: string | null,
): string | null {
  if (!entityType || !entityId) return null;
  if (entityType === "booking") return `/bookings/${entityId}`;
  if (entityType === "conversation") return `/inbox?conversation=${entityId}`;
  return null;
}

export async function listActiveLivMoments(
  businessId: string,
  limit = 8,
): Promise<LivMoment[]> {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const rows = await db
    .select()
    .from(livSignalsTable)
    .where(
      and(
        eq(livSignalsTable.businessId, businessId),
        isNull(livSignalsTable.dismissedAt),
        gte(livSignalsTable.createdAt, since),
      ),
    )
    .orderBy(desc(livSignalsTable.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    priority: r.priority as LivSignalPriority,
    title: r.title,
    body: r.body,
    entityType: r.entityType,
    entityId: r.entityId,
    createdAt: r.createdAt.toISOString(),
    href: hrefForEntity(r.entityType, r.entityId),
  }));
}

export async function upsertLivSignal(args: {
  businessId: string;
  kind: string;
  priority: LivSignalPriority;
  title: string;
  body: string;
  dedupeKey: string;
  eventName?: string;
  entityType?: string;
  entityId?: string;
  ttlHours?: number;
}): Promise<boolean> {
  const expiresAt = args.ttlHours
    ? new Date(Date.now() + args.ttlHours * 60 * 60 * 1000)
    : new Date(Date.now() + 72 * 60 * 60 * 1000);

  try {
    await db.insert(livSignalsTable).values({
      id: generateId(),
      businessId: args.businessId,
      kind: args.kind,
      priority: args.priority,
      title: args.title,
      body: args.body,
      eventName: args.eventName ?? null,
      entityType: args.entityType ?? null,
      entityId: args.entityId ?? null,
      dedupeKey: args.dedupeKey,
      expiresAt,
    });
    return true;
  } catch (err: unknown) {
    const code =
      (err as { code?: string })?.code ??
      (err as { cause?: { code?: string } })?.cause?.code ??
      (err as { cause?: { cause?: { code?: string } } })?.cause?.cause?.code;
    if (code === "23505") return false;
    throw err;
  }
}

export async function dismissLivSignal(
  businessId: string,
  signalId: string,
): Promise<boolean> {
  const [row] = await db
    .update(livSignalsTable)
    .set({ dismissedAt: new Date() })
    .where(
      and(eq(livSignalsTable.id, signalId), eq(livSignalsTable.businessId, businessId)),
    )
    .returning({ id: livSignalsTable.id });
  return !!row;
}
