import { db, eventsTable, visitFeedbackTable } from "@workspace/db";
import { and, desc, eq, gte } from "drizzle-orm";
import { getInternalTenantDetail } from "./internal-ops.service";
import { listSupportTickets } from "./support-tickets.service";

export type InternalSupportBundle = {
  businessId: string;
  vertical: string;
  operatorPackSections: string[];
  suggestedReplySnippets: string[];
  recentAudit: Array<{ type: string; createdAt: string; entityType: string | null }>;
  openTickets: Array<{ id: string; category: string; severity: string; description: string }>;
  recentFeedback: Array<{ score: number; comment: string | null; createdAt: string }>;
  impersonationPolicy: string;
};

function packSectionsForVertical(vertical: string): string[] {
  const base = [
    "OPERATOR-READY-PACK.md § Week zero",
    "templates/customer-booking-policy.md",
    "templates/team-on-livia.md",
  ];
  if (vertical === "allied-health") {
    return [...base, "templates/leave-and-rota.md", "workflows/time-off-request.md"];
  }
  if (vertical === "body-art") {
    return [...base, "templates/running-late-procedure.md", "workflows/running-late.md"];
  }
  if (vertical === "medspa") {
    return [...base, "templates/ai-disclosure-for-customers.md"];
  }
  return [...base, "templates/running-late-procedure.md", "templates/post-visit-feedback.md"];
}

function snippetsForCategory(category: string, vertical: string): string[] {
  if (category === "liv_error") {
    return [
      "Check Settings → Liv tone and tool catalog.",
      "Open the conversation thread and use Take over once to compare Liv vs your reply.",
    ];
  }
  if (category === "billing") {
    return ["Stripe status is on the health card — share billing portal link from Settings → Billing."];
  }
  if (category === "bug" && vertical === "allied-health") {
    return ["Confirm vertical is allied-health in Settings — UI should say Practice, not Shop."];
  }
  return ["See OPERATOR-READY-PACK.md for the workflow that matches this issue."];
}

export async function buildInternalSupportBundle(
  businessId: string,
): Promise<InternalSupportBundle | null> {
  const detail = await getInternalTenantDetail(businessId);
  if (!detail) return null;

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const recentAudit = await db
    .select({
      type: eventsTable.type,
      createdAt: eventsTable.createdAt,
      entityType: eventsTable.entityType,
    })
    .from(eventsTable)
    .where(and(eq(eventsTable.businessId, businessId), gte(eventsTable.createdAt, since)))
    .orderBy(desc(eventsTable.createdAt))
    .limit(12);

  const tickets = await listSupportTickets(businessId, "open");
  const recentFeedback = await db
    .select({
      score: visitFeedbackTable.score,
      comment: visitFeedbackTable.comment,
      createdAt: visitFeedbackTable.createdAt,
    })
    .from(visitFeedbackTable)
    .where(
      and(
        eq(visitFeedbackTable.businessId, businessId),
        gte(visitFeedbackTable.createdAt, since),
      ),
    )
    .orderBy(desc(visitFeedbackTable.createdAt))
    .limit(5);

  const topCategory = tickets[0]?.category ?? "other";

  return {
    businessId,
    vertical: detail.vertical,
    operatorPackSections: packSectionsForVertical(detail.vertical),
    suggestedReplySnippets: snippetsForCategory(topCategory, detail.vertical),
    recentAudit: recentAudit.map((e) => ({
      type: e.type,
      createdAt: e.createdAt.toISOString(),
      entityType: e.entityType,
    })),
    openTickets: tickets.slice(0, 5).map((t) => ({
      id: t.id,
      category: t.category,
      severity: t.severity,
      description: t.description.slice(0, 200),
    })),
    recentFeedback: recentFeedback.map((f) => ({
      score: f.score,
      comment: f.comment,
      createdAt: f.createdAt.toISOString(),
    })),
    impersonationPolicy:
      "Do not use tenant JWT from this portal. Owner view-as is audited in tenant dashboard only.",
  };
}
