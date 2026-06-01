import { db, conversationsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";

export type LinkedInboxCase = {
  conversationId: string;
  status: string;
  caseIntent: string | null;
  summary: string | null;
  resolution: {
    outcome?: string;
    refundMinor?: number | null;
    at?: string;
    effects?: string[];
  } | null;
};

/** Latest inbox thread linked to this booking (refund / dispute flows). */
export async function getLinkedInboxCaseForBooking(
  businessId: string,
  bookingId: string,
): Promise<LinkedInboxCase | null> {
  const [conv] = await db
    .select({
      id: conversationsTable.id,
      status: conversationsTable.status,
      caseIntent: conversationsTable.caseIntent,
      summary: conversationsTable.summary,
      resolution: conversationsTable.resolution,
    })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        eq(conversationsTable.linkedBookingId, bookingId),
      ),
    )
    .orderBy(desc(conversationsTable.updatedAt))
    .limit(1);

  if (!conv) return null;

  return {
    conversationId: conv.id,
    status: conv.status,
    caseIntent: conv.caseIntent,
    summary: conv.summary,
    resolution: (conv.resolution as LinkedInboxCase["resolution"]) ?? null,
  };
}

export function isRefundLinkedCase(c: LinkedInboxCase | null): boolean {
  if (!c) return false;
  return (
    c.caseIntent === "refund_request" ||
    (c.summary?.toLowerCase().includes("refund") ?? false)
  );
}
