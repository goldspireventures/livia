import { and, eq, like } from "drizzle-orm";
import { db, businessesTable, supportTicketsTable } from "@workspace/db";
import { createSupportTicket } from "./support-tickets.service";

export const DEMO_SUPPORT_TICKET_MARKER = "[demo-seed]";

const DEMO_TICKETS: Array<{
  slug: string;
  category: "bug" | "billing" | "liv_error" | "feature" | "other";
  severity: "blocking" | "annoying" | "nice_to_have";
  description: string;
}> = [
  {
    slug: "aurora-studio",
    category: "liv_error",
    severity: "blocking",
    description: `${DEMO_SUPPORT_TICKET_MARKER} Liv double-booked a colour slot — customer waiting on callback.`,
  },
  {
    slug: "aurora-studio",
    category: "billing",
    severity: "annoying",
    description: `${DEMO_SUPPORT_TICKET_MARKER} Stripe payout date mismatch on March statement.`,
  },
  {
    slug: "clarity-medspa-dublin",
    category: "feature",
    severity: "nice_to_have",
    description: `${DEMO_SUPPORT_TICKET_MARKER} Need consent PDF attached to medspa booking confirmations.`,
  },
  {
    slug: "paws-parlour-dublin",
    category: "bug",
    severity: "annoying",
    description: `${DEMO_SUPPORT_TICKET_MARKER} Pet profile photo not showing on public booking.`,
  },
  {
    slug: "london-rose-spa",
    category: "billing",
    severity: "blocking",
    description: `${DEMO_SUPPORT_TICKET_MARKER} VAT line missing on UK invoice export.`,
  },
  {
    slug: "ink-anchor-galway",
    category: "liv_error",
    severity: "annoying",
    description: `${DEMO_SUPPORT_TICKET_MARKER} Design proof reminder sent twice for same session.`,
  },
  {
    slug: "motion-physio-cork",
    category: "other",
    severity: "nice_to_have",
    description: `${DEMO_SUPPORT_TICKET_MARKER} Long-session policy copy review before go-live.`,
  },
  {
    slug: "conors-cut-co",
    category: "feature",
    severity: "annoying",
    description: `${DEMO_SUPPORT_TICKET_MARKER} Walk-in queue badge not visible on My Day.`,
  },
];

/** Open tickets for internal ops queue + tenant help dialog context. */
export async function seedDemoSupportTickets(submitterUserId: string): Promise<number> {
  if (!submitterUserId) return 0;

  let seeded = 0;
  for (const t of DEMO_TICKETS) {
    const [biz] = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.slug, t.slug))
      .limit(1);
    if (!biz) continue;

    const [existing] = await db
      .select({ id: supportTicketsTable.id })
      .from(supportTicketsTable)
      .where(
        and(
          eq(supportTicketsTable.businessId, biz.id),
          like(supportTicketsTable.description, `${DEMO_SUPPORT_TICKET_MARKER}%`),
          eq(supportTicketsTable.category, t.category),
        ),
      )
      .limit(1);
    if (existing) continue;

    await createSupportTicket({
      businessId: biz.id,
      userId: submitterUserId,
      category: t.category,
      severity: t.severity,
      description: t.description,
      consentLogsAccess: true,
      context: { source: "demo-seed", slug: t.slug },
    });
    seeded += 1;
  }
  return seeded;
}
