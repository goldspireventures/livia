import {
  db,
  businessesTable,
  usersTable,
  supportTicketsTable,
  conversationsTable,
  conversationMessagesTable,
  eventsTable,
} from "@workspace/db";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { InternalOpsOperator } from "../lib/internal-ops-rbac";
import { triageSupportTicket, type SupportTriage } from "./support-ticket-triage.service";
import { getInternalTenantDetail } from "./internal-ops.service";
import { traceByRequestId } from "./internal-request-trace.service";
import { generateId } from "../lib/id";
import { listPlatformContinuityTraces } from "./internal-continuity-traces.service";

export type InternalTicketNote = { at: string; by: string; body: string };

export type InternalSupportTicketRow = {
  id: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  vertical: string | null;
  userId: string;
  reporterEmail: string | null;
  category: string;
  severity: string;
  description: string;
  status: string;
  assignedTo: string | null;
  internalNotes: InternalTicketNote[];
  triagedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  context: Record<string, unknown>;
  triage?: SupportTriage;
};

function serializeTicket(row: {
  id: string;
  businessId: string;
  userId: string;
  category: string;
  severity: string;
  description: string;
  status: string;
  assignedTo: string | null;
  internalNotes: InternalTicketNote[] | null;
  triagedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  context: Record<string, unknown> | null;
  businessName?: string;
  businessSlug?: string;
  vertical?: string | null;
  reporterEmail?: string | null;
}): InternalSupportTicketRow {
  const ctx = (row.context ?? {}) as Record<string, unknown> & { triage?: SupportTriage };
  return {
    id: row.id,
    businessId: row.businessId,
    businessName: row.businessName ?? "",
    businessSlug: row.businessSlug ?? "",
    vertical: row.vertical ?? null,
    userId: row.userId,
    reporterEmail: row.reporterEmail ?? null,
    category: row.category,
    severity: row.severity,
    description: row.description,
    status: row.status,
    assignedTo: row.assignedTo,
    internalNotes: row.internalNotes ?? [],
    triagedAt: row.triagedAt?.toISOString() ?? null,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    context: ctx,
    triage: ctx.triage,
  };
}

export async function listInternalSupportTickets(opts: {
  status?: string;
  category?: string;
  priority?: string;
  assignedTo?: string;
  businessId?: string;
  surfaceId?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: InternalSupportTicketRow[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = opts.offset ?? 0;
  const conditions = [];

  const statusFilter = opts.status?.trim();
  if (statusFilter && statusFilter !== "all") {
    const statuses = statusFilter.split(",").map((s) => s.trim()) as Array<
      "open" | "triaged" | "resolved" | "closed"
    >;
    if (statuses.length === 1) {
      conditions.push(eq(supportTicketsTable.status, statuses[0]!));
    } else if (statuses.length > 1) {
      conditions.push(inArray(supportTicketsTable.status, statuses));
    }
  } else if (!statusFilter) {
    conditions.push(inArray(supportTicketsTable.status, ["open", "triaged"]));
  }

  if (opts.category?.trim()) {
    conditions.push(eq(supportTicketsTable.category, opts.category.trim() as never));
  }
  if (opts.assignedTo?.trim()) {
    const a = opts.assignedTo.trim();
    if (a === "unassigned") {
      conditions.push(sql`${supportTicketsTable.assignedTo} is null`);
    } else {
      conditions.push(eq(supportTicketsTable.assignedTo, a));
    }
  }
  if (opts.businessId?.trim()) {
    conditions.push(eq(supportTicketsTable.businessId, opts.businessId.trim()));
  }

  let freeTextQ = opts.q?.trim() ?? "";
  if (freeTextQ.toLowerCase().startsWith("surface:")) {
    const sid = freeTextQ.slice("surface:".length).trim();
    if (sid) {
      conditions.push(sql`(${supportTicketsTable.context}->>'surfaceId') = ${sid}`);
      freeTextQ = "";
    }
  }
  if (opts.surfaceId?.trim()) {
    conditions.push(
      sql`(${supportTicketsTable.context}->>'surfaceId') = ${opts.surfaceId.trim()}`,
    );
  }
  if (freeTextQ) {
    conditions.push(ilike(supportTicketsTable.description, `%${freeTextQ}%`));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const base = db
    .select({
      id: supportTicketsTable.id,
      businessId: supportTicketsTable.businessId,
      userId: supportTicketsTable.userId,
      category: supportTicketsTable.category,
      severity: supportTicketsTable.severity,
      description: supportTicketsTable.description,
      status: supportTicketsTable.status,
      assignedTo: supportTicketsTable.assignedTo,
      internalNotes: supportTicketsTable.internalNotes,
      triagedAt: supportTicketsTable.triagedAt,
      resolvedAt: supportTicketsTable.resolvedAt,
      createdAt: supportTicketsTable.createdAt,
      updatedAt: supportTicketsTable.updatedAt,
      context: supportTicketsTable.context,
      businessName: businessesTable.name,
      businessSlug: businessesTable.slug,
      vertical: businessesTable.vertical,
      reporterEmail: usersTable.email,
    })
    .from(supportTicketsTable)
    .innerJoin(businessesTable, eq(businessesTable.id, supportTicketsTable.businessId))
    .leftJoin(usersTable, eq(usersTable.id, supportTicketsTable.userId));

  const rows = await (whereClause ? base.where(whereClause) : base)
    .orderBy(desc(supportTicketsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supportTicketsTable)
    .where(whereClause ?? sql`true`);

  let data = rows.map((r) =>
    serializeTicket({
      ...r,
      internalNotes: (r.internalNotes as InternalTicketNote[]) ?? [],
      context: (r.context as Record<string, unknown>) ?? {},
    }),
  );

  if (opts.priority?.trim()) {
    data = data.filter((t) => t.triage?.priority === opts.priority);
  }

  return { data, total: countRows[0]?.count ?? data.length };
}

export async function getInternalSupportTicket(
  ticketId: string,
): Promise<InternalSupportTicketRow | null> {
  const [row] = await db
    .select({
      id: supportTicketsTable.id,
      businessId: supportTicketsTable.businessId,
      userId: supportTicketsTable.userId,
      category: supportTicketsTable.category,
      severity: supportTicketsTable.severity,
      description: supportTicketsTable.description,
      status: supportTicketsTable.status,
      assignedTo: supportTicketsTable.assignedTo,
      internalNotes: supportTicketsTable.internalNotes,
      triagedAt: supportTicketsTable.triagedAt,
      resolvedAt: supportTicketsTable.resolvedAt,
      createdAt: supportTicketsTable.createdAt,
      updatedAt: supportTicketsTable.updatedAt,
      context: supportTicketsTable.context,
      businessName: businessesTable.name,
      businessSlug: businessesTable.slug,
      vertical: businessesTable.vertical,
      reporterEmail: usersTable.email,
    })
    .from(supportTicketsTable)
    .innerJoin(businessesTable, eq(businessesTable.id, supportTicketsTable.businessId))
    .leftJoin(usersTable, eq(usersTable.id, supportTicketsTable.userId))
    .where(eq(supportTicketsTable.id, ticketId))
    .limit(1);

  if (!row) return null;
  return serializeTicket({
    ...row,
    internalNotes: (row.internalNotes as InternalTicketNote[]) ?? [],
    context: (row.context as Record<string, unknown>) ?? {},
  });
}

async function logInternalTicketEvent(
  businessId: string,
  ticketId: string,
  operator: InternalOpsOperator,
  action: string,
  payload: Record<string, unknown>,
) {
  await db.insert(eventsTable).values({
    id: generateId(),
    type: "INTERNAL_SUPPORT_TICKET",
    source: "internal-ops",
    level: "INFO",
    businessId,
    entityType: "support_ticket",
    entityId: ticketId,
    context: { action, operator: operator.email, role: operator.role, ...payload },
  });
}

export async function patchInternalSupportTicket(
  ticketId: string,
  operator: InternalOpsOperator,
  patch: {
    status?: "open" | "triaged" | "resolved" | "closed";
    assignedTo?: string | null;
    note?: string;
    reTriage?: boolean;
  },
): Promise<InternalSupportTicketRow | null> {
  const existing = await getInternalSupportTicket(ticketId);
  if (!existing) return null;

  const notes = [...existing.internalNotes];
  const updates: Partial<typeof supportTicketsTable.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (patch.note?.trim()) {
    notes.push({
      at: new Date().toISOString(),
      by: operator.email,
      body: patch.note.trim(),
    });
    updates.internalNotes = notes;
  }

  if (patch.assignedTo !== undefined) {
    updates.assignedTo = patch.assignedTo;
  }

  if (patch.status) {
    const allowed: Record<string, string[]> = {
      open: ["triaged", "resolved", "closed"],
      triaged: ["open", "resolved", "closed"],
      resolved: ["open", "closed"],
      closed: ["open"],
    };
    const from = existing.status;
    if (!allowed[from]?.includes(patch.status) && from !== patch.status) {
      throw Object.assign(new Error(`Invalid status transition ${from} → ${patch.status}`), {
        status: 400,
        code: "INVALID_STATUS_TRANSITION",
      });
    }
    updates.status = patch.status;
    if (patch.status === "triaged" && !existing.triagedAt) {
      updates.triagedAt = new Date();
    }
    if ((patch.status === "resolved" || patch.status === "closed") && !existing.resolvedAt) {
      updates.resolvedAt = new Date();
    }
    if (patch.status === "open") {
      updates.triagedAt = null;
      updates.resolvedAt = null;
    }
  }

  if (patch.reTriage) {
    const triage = triageSupportTicket({
      category: existing.category,
      description: existing.description,
      severity: existing.severity,
    });
    updates.context = { ...existing.context, triage };
  }

  await db
    .update(supportTicketsTable)
    .set(updates as Record<string, unknown>)
    .where(eq(supportTicketsTable.id, ticketId));

  await logInternalTicketEvent(existing.businessId, ticketId, operator, "patch", {
    status: patch.status,
    assignedTo: patch.assignedTo,
    hasNote: Boolean(patch.note),
  });

  return getInternalSupportTicket(ticketId);
}

export type LivIncidentBundle = {
  ticketId: string;
  category: string;
  conversationId: string | null;
  requestId: string | null;
  bookingId: string | null;
  conversation: {
    id: string;
    channel: string;
    status: string;
    summary: string | null;
    lastMessageAt: string;
  } | null;
  recentMessages: Array<{ role: string; content: string; createdAt: string; toolName: string | null }>;
  workflowEvents: Array<{ type: string; createdAt: string; level: string | null }>;
  continuityHints: Array<{ businessId: string; slug: string; stuckLabel: string | null }>;
  trace: Awaited<ReturnType<typeof traceByRequestId>> | null;
  suggestedActions: string[];
  learningMemory: Array<{ id: string; summary: string; source: string; createdAt: string }>;
};

export async function getLivIncidentBundleForTicket(
  ticketId: string,
): Promise<LivIncidentBundle | null> {
  const ticket = await getInternalSupportTicket(ticketId);
  if (!ticket) return null;

  const ctx = ticket.context;
  const conversationId =
    typeof ctx.conversationId === "string" ? ctx.conversationId : null;
  const requestId = typeof ctx.requestId === "string" ? ctx.requestId : null;
  const bookingId = typeof ctx.bookingId === "string" ? ctx.bookingId : null;

  let conversation: LivIncidentBundle["conversation"] = null;
  let recentMessages: LivIncidentBundle["recentMessages"] = [];

  if (conversationId) {
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.id, conversationId),
          eq(conversationsTable.businessId, ticket.businessId),
        ),
      )
      .limit(1);
    if (conv) {
      conversation = {
        id: conv.id,
        channel: conv.channel,
        status: conv.status,
        summary: conv.summary,
        lastMessageAt: conv.lastMessageAt.toISOString(),
      };
      const msgs = await db
        .select({
          role: conversationMessagesTable.role,
          content: conversationMessagesTable.content,
          createdAt: conversationMessagesTable.createdAt,
          toolName: conversationMessagesTable.toolName,
        })
        .from(conversationMessagesTable)
        .where(eq(conversationMessagesTable.conversationId, conversationId))
        .orderBy(desc(conversationMessagesTable.createdAt))
        .limit(12);
      recentMessages = msgs.reverse().map((m) => ({
        role: m.role,
        content: m.content.slice(0, 2000),
        createdAt: m.createdAt.toISOString(),
        toolName: m.toolName,
      }));
    }
  }

  const workflowEvents = await db
    .select({
      type: eventsTable.type,
      createdAt: eventsTable.createdAt,
      level: eventsTable.level,
    })
    .from(eventsTable)
    .where(
      and(
        eq(eventsTable.businessId, ticket.businessId),
        or(
          eq(eventsTable.entityId, ticketId),
          conversationId ? eq(eventsTable.entityId, conversationId) : sql`false`,
        ),
      ),
    )
    .orderBy(desc(eventsTable.createdAt))
    .limit(15);

  const traces = await listPlatformContinuityTraces(50);
  const continuityHints = traces
    .filter((t) => t.businessId === ticket.businessId)
    .slice(0, 5)
    .map((t) => ({
      businessId: t.businessId,
      slug: t.businessSlug,
      stuckLabel: t.pendingReason ?? t.status,
    }));

  const trace = requestId ? await traceByRequestId(requestId, ticket.businessId) : null;
  const tenant = await getInternalTenantDetail(ticket.businessId);

  const suggestedActions: string[] = [
    "Review conversation thread in tenant dashboard Inbox.",
    "Compare Liv tool catalog and tone under Settings → Liv.",
  ];
  if (ticket.category === "liv_error") {
    suggestedActions.push(
      "Check continuity traces tab for stuck booking state.",
      "Review Liv learning memory — correction should appear in recent rows.",
      "If systemic, pause Liv for tenant (on-call / founder only — not in portal v1).",
    );
  }
  if (tenant && !tenant.aiEnabled) {
    suggestedActions.push("Tenant has AI disabled — confirm expected before blaming Liv.");
  }

  return {
    ticketId,
    category: ticket.category,
    conversationId,
    requestId,
    bookingId,
    conversation,
    recentMessages,
    workflowEvents: workflowEvents.map((e) => ({
      type: e.type,
      createdAt: e.createdAt.toISOString(),
      level: e.level,
    })),
    continuityHints,
    trace,
    suggestedActions,
    learningMemory: await import("./liv-memory.service").then((m) =>
      m.listRecentLearningMemoryForBusiness(ticket.businessId, 6),
    ),
  };
}
