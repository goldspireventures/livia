import { and, eq, or } from "drizzle-orm";
import { db, slotWaitlistEntriesTable, businessesTable } from "@workspace/db";
import { createBooking, getBookingById } from "./bookings.service";
import { publishDomainEvent } from "../lib/domain-events";
import { logger } from "../lib/logger";

const YES_RE = /^(yes|y|yeah|yep|ok|okay|confirm|book)\b/i;

/** If customer replies YES to a waitlist offer SMS, book the freed slot. */
export async function tryAcceptWaitlistOfferFromSms(args: {
  businessId: string;
  customerId: string;
  phone: string;
  body: string;
}): Promise<{ accepted: boolean; bookingId?: string; message?: string }> {
  const trimmed = args.body.trim();
  if (!YES_RE.test(trimmed)) return { accepted: false };

  const offered = await db
    .select()
    .from(slotWaitlistEntriesTable)
    .where(
      and(
        eq(slotWaitlistEntriesTable.businessId, args.businessId),
        eq(slotWaitlistEntriesTable.status, "offered"),
        or(
          eq(slotWaitlistEntriesTable.phone, args.phone),
          eq(slotWaitlistEntriesTable.customerId, args.customerId),
        ),
      ),
    )
    .limit(5);

  const entry = offered[0];
  if (!entry?.offeredBookingId || !entry.serviceId) {
    return { accepted: false };
  }

  if (entry.expiresAt && entry.expiresAt.getTime() < Date.now()) {
    await db
      .update(slotWaitlistEntriesTable)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(slotWaitlistEntriesTable.id, entry.id));
    return {
      accepted: false,
      message: "That offer has expired — reply anytime and Liv will find the next opening.",
    };
  }

  const cancelled = await getBookingById(args.businessId, entry.offeredBookingId);
  if (!cancelled || cancelled.status !== "CANCELLED") {
    return { accepted: false };
  }

  const [biz] = await db
    .select({ timezone: businessesTable.timezone })
    .from(businessesTable)
    .where(eq(businessesTable.id, args.businessId))
    .limit(1);

  try {
    const created = await createBooking(args.businessId, {
      serviceId: cancelled.serviceId,
      customerId: args.customerId,
      staffId: cancelled.staffId ?? undefined,
      startAt: new Date(cancelled.startAt).toISOString(),
      channelType: "SMS",
      source: "waitlist-offer",
      notes: "Accepted waitlist offer via SMS YES",
    });

    await db
      .update(slotWaitlistEntriesTable)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(slotWaitlistEntriesTable.id, entry.id));

    const when = new Date(created.startAt).toLocaleString("en-IE", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: biz?.timezone ?? "Europe/Dublin",
    });

    void publishDomainEvent(
      "booking.created",
      {
        businessId: args.businessId,
        bookingId: created.id,
        customerId: args.customerId,
        serviceId: created.serviceId,
        staffId: created.staffId,
        source: "web",
        sourceConversationId: null,
        startAt: new Date(created.startAt).toISOString(),
      },
      `${args.businessId}:${created.id}:waitlist-accept`,
    );

    return {
      accepted: true,
      bookingId: created.id,
      message: `You're booked for ${when}. We'll send a confirmation shortly.`,
    };
  } catch (err) {
    logger.warn({ err, businessId: args.businessId, entryId: entry.id }, "waitlist YES accept failed");
    return {
      accepted: false,
      message: "That slot was just taken — reply anytime and Liv will find the next opening.",
    };
  }
}
