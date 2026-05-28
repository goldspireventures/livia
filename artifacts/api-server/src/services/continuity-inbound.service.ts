import { and, eq } from "drizzle-orm";
import { db, bookingsTable } from "@workspace/db";
import { attachBookingMedia } from "./booking-media.service";
import { logEvent } from "./events.service";
import { updateBookingStatus } from "./bookings.service";

/**
 * When a customer replies on a continuity thread, link media to the booking
 * and record the reply. Staff still confirms unless policy allows auto-confirm later.
 */
export async function handleContinuityInbound(args: {
  businessId: string;
  conversationId: string;
  body: string;
  mediaUrls?: string[];
}): Promise<{ bookingId?: string; mediaAttached: number }> {
  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, args.businessId),
        eq(bookingsTable.continuityConversationId, args.conversationId),
        eq(bookingsTable.pendingReason, "awaiting_continuity"),
      ),
    )
    .limit(1);

  if (!booking) return { mediaAttached: 0 };

  let mediaAttached = 0;
  for (const url of args.mediaUrls ?? []) {
    await attachBookingMedia(args.businessId, booking.id, {
      url,
      mimeType: "image/jpeg",
      kind: "continuity_inbound",
    });
    mediaAttached++;
  }

  const snippet = args.body.trim().slice(0, 200);
  await logEvent({
    type: "BOOKING_CONTINUITY_REPLY",
    businessId: args.businessId,
    entityType: "booking",
    entityId: booking.id,
    context: {
      conversationId: args.conversationId,
      hasMedia: mediaAttached > 0,
      snippet: snippet || undefined,
    },
  });

  if (snippet.length > 0 && /^(yes|confirm|ok|okay|perfect|thanks)/i.test(snippet)) {
    await updateBookingStatus(args.businessId, booking.id, { status: "CONFIRMED" });
    await logEvent({
      type: "BOOKING_CONFIRMED",
      businessId: args.businessId,
      entityType: "booking",
      entityId: booking.id,
      context: { source: "continuity_auto_confirm", conversationId: args.conversationId },
    });
    return { bookingId: booking.id, mediaAttached };
  }

  return { bookingId: booking.id, mediaAttached };
}
