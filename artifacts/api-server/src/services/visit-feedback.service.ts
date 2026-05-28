import { db, visitFeedbackTable, bookingsTable } from "@workspace/db";
import { and, desc, eq, gte } from "drizzle-orm";
import { generateId } from "../lib/id";
import { logEvent } from "./events.service";

export async function submitVisitFeedback(args: {
  businessId: string;
  bookingId: string;
  customerId: string;
  score: number;
  comment?: string;
}): Promise<{ id: string }> {
  if (args.score < 1 || args.score > 5) throw new Error("INVALID_SCORE");

  const [booking] = await db
    .select({ status: bookingsTable.status })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.id, args.bookingId),
        eq(bookingsTable.businessId, args.businessId),
      ),
    )
    .limit(1);
  if (!booking || booking.status !== "COMPLETED") {
    throw new Error("BOOKING_NOT_COMPLETED");
  }

  const [dup] = await db
    .select({ id: visitFeedbackTable.id })
    .from(visitFeedbackTable)
    .where(eq(visitFeedbackTable.bookingId, args.bookingId))
    .limit(1);
  if (dup) throw new Error("ALREADY_SUBMITTED");

  const id = generateId();
  await db.insert(visitFeedbackTable).values({
    id,
    businessId: args.businessId,
    bookingId: args.bookingId,
    customerId: args.customerId,
    score: args.score,
    comment: args.comment?.trim() || null,
  });

  await logEvent({
    type: "VISIT_FEEDBACK_SUBMITTED",
    businessId: args.businessId,
    entityType: "visit_feedback",
    entityId: id,
    context: { bookingId: args.bookingId, score: args.score, needsAttention: args.score <= 3 },
    level: args.score <= 3 ? "WARN" : "INFO",
  });

  return { id };
}

export async function listRecentVisitFeedback(businessId: string, days = 14) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(visitFeedbackTable)
    .where(
      and(
        eq(visitFeedbackTable.businessId, businessId),
        gte(visitFeedbackTable.createdAt, since),
      ),
    )
    .orderBy(desc(visitFeedbackTable.createdAt))
    .limit(50);
}
