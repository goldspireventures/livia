import { and, eq, desc } from "drizzle-orm";
import { db, eventsTable } from "@workspace/db";

export type BookingTimelineEntry = {
  id: string;
  type: string;
  label: string;
  at: string;
  context?: Record<string, unknown>;
};

const TYPE_LABELS: Record<string, string> = {
  BOOKING_CREATED: "Booking created",
  BOOKING_CONFIRMED: "Confirmed",
  BOOKING_CANCELLED: "Cancelled",
  BOOKING_COMPLETED: "Completed",
  BOOKING_NO_SHOW: "Marked no-show",
  BOOKING_CONTINUITY_SENT: "Continuity message sent",
  BOOKING_CONTINUITY_REPLY: "Client replied in thread",
  BOOKING_MEDIA_ATTACHED: "Photo or file attached",
};

export async function getBookingTimeline(
  businessId: string,
  bookingId: string,
): Promise<BookingTimelineEntry[]> {
  const rows = await db
    .select()
    .from(eventsTable)
    .where(
      and(
        eq(eventsTable.businessId, businessId),
        eq(eventsTable.entityType, "booking"),
        eq(eventsTable.entityId, bookingId),
      ),
    )
    .orderBy(desc(eventsTable.createdAt))
    .limit(50);

  return rows
    .map((e) => ({
      id: e.id,
      type: e.type,
      label: TYPE_LABELS[e.type] ?? e.type.replace(/_/g, " ").toLowerCase(),
      at: e.createdAt.toISOString(),
      context: (e.context as Record<string, unknown>) ?? undefined,
    }))
    .reverse();
}
