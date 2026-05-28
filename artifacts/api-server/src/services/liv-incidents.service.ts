import { db, eventsTable, supportTicketsTable } from "@workspace/db";
import { and, desc, eq, inArray } from "drizzle-orm";

export type LivIncidentItem = {
  id: string;
  kind: "incident" | "support_ticket";
  createdAt: string;
  ticketId: string | null;
  conversationId: string | null;
  bookingId: string | null;
  status: string;
  summary: string;
};

function contextField(ctx: Record<string, unknown> | null | undefined, key: string): string | null {
  const v = ctx?.[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function listLivIncidentsForBusiness(
  businessId: string,
  limit = 20,
): Promise<{ data: LivIncidentItem[]; openCount: number }> {
  const [eventRows, ticketRows] = await Promise.all([
    db
      .select({
        id: eventsTable.id,
        createdAt: eventsTable.createdAt,
        entityId: eventsTable.entityId,
        context: eventsTable.context,
      })
      .from(eventsTable)
      .where(
        and(
          eq(eventsTable.businessId, businessId),
          eq(eventsTable.type, "INCIDENT_CREATED"),
        ),
      )
      .orderBy(desc(eventsTable.createdAt))
      .limit(limit),
    db
      .select({
        id: supportTicketsTable.id,
        createdAt: supportTicketsTable.createdAt,
        status: supportTicketsTable.status,
        description: supportTicketsTable.description,
        context: supportTicketsTable.context,
      })
      .from(supportTicketsTable)
      .where(
        and(
          eq(supportTicketsTable.businessId, businessId),
          eq(supportTicketsTable.category, "liv_error"),
          inArray(supportTicketsTable.status, ["open", "triaged"]),
        ),
      )
      .orderBy(desc(supportTicketsTable.createdAt))
      .limit(limit),
  ]);

  const fromEvents: LivIncidentItem[] = eventRows.map((e) => {
    const ctx = (e.context ?? {}) as Record<string, unknown>;
    const ticketId = e.entityId ?? null;
    return {
      id: `event:${e.id}`,
      kind: "incident" as const,
      createdAt: e.createdAt.toISOString(),
      ticketId,
      conversationId: contextField(ctx, "conversationId"),
      bookingId: contextField(ctx, "bookingId"),
      status: "triaged",
      summary: "Liv error reported — automation paused for review",
    };
  });

  const fromTickets: LivIncidentItem[] = ticketRows.map((t) => {
    const ctx = (t.context ?? {}) as Record<string, unknown>;
    const preview =
      t.description.length > 120 ? `${t.description.slice(0, 117)}…` : t.description;
    return {
      id: `ticket:${t.id}`,
      kind: "support_ticket" as const,
      createdAt: t.createdAt.toISOString(),
      ticketId: t.id,
      conversationId: contextField(ctx, "conversationId"),
      bookingId: contextField(ctx, "bookingId"),
      status: t.status,
      summary: preview,
    };
  });

  const seenTickets = new Set<string>();
  const merged: LivIncidentItem[] = [];
  for (const row of [...fromTickets, ...fromEvents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )) {
    const key = row.ticketId ?? row.id;
    if (row.ticketId && seenTickets.has(row.ticketId)) continue;
    if (row.ticketId) seenTickets.add(row.ticketId);
    merged.push(row);
    if (merged.length >= limit) break;
  }

  const openCount = ticketRows.length;
  return { data: merged, openCount };
}
