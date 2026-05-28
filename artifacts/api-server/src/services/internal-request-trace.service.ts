import { db, eventsTable, supportTicketsTable } from "@workspace/db";
import { and, desc, eq, gte, or } from "drizzle-orm";

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export type RequestTraceResult = {
  requestId: string;
  hint: string;
  sentrySearchUrl: string | null;
  tenantEvents: Array<{ type: string; createdAt: string; entityType: string | null }>;
  openTickets: Array<{ id: string; category: string; severity: string; createdAt: string }>;
};

export async function traceByRequestId(
  requestId: string,
  businessId?: string,
): Promise<RequestTraceResult | null> {
  if (!UUID_RE.test(requestId)) return null;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const tenantEvents = businessId
    ? await db
        .select({
          type: eventsTable.type,
          createdAt: eventsTable.createdAt,
          entityType: eventsTable.entityType,
        })
        .from(eventsTable)
        .where(
          and(eq(eventsTable.businessId, businessId), gte(eventsTable.createdAt, since)),
        )
        .orderBy(desc(eventsTable.createdAt))
        .limit(20)
    : [];

  const openTickets = businessId
    ? await db
        .select({
          id: supportTicketsTable.id,
          category: supportTicketsTable.category,
          severity: supportTicketsTable.severity,
          createdAt: supportTicketsTable.createdAt,
        })
        .from(supportTicketsTable)
        .where(
          and(
            eq(supportTicketsTable.businessId, businessId),
            or(
              eq(supportTicketsTable.status, "open"),
              eq(supportTicketsTable.status, "triaged"),
            ),
          ),
        )
        .orderBy(desc(supportTicketsTable.createdAt))
        .limit(10)
    : [];

  const org = process.env.SENTRY_ORG_SLUG?.trim();
  const project = process.env.SENTRY_PROJECT_SLUG?.trim();
  const sentrySearchUrl =
    org && project
      ? `https://sentry.io/organizations/${org}/issues/?query=request_id%3A${requestId}`
      : null;

  return {
    requestId,
    hint:
      "Correlate API logs in your sink with field request_id. HTTP access logs include request_id, tenant_id, path, status.",
    sentrySearchUrl,
    tenantEvents: tenantEvents.map((e) => ({
      type: e.type,
      createdAt: e.createdAt.toISOString(),
      entityType: e.entityType,
    })),
    openTickets: openTickets.map((t) => ({
      id: t.id,
      category: t.category,
      severity: t.severity,
      createdAt: t.createdAt.toISOString(),
    })),
  };
}
