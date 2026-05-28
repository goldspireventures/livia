import type { EventPayload } from "@workspace/event-bus";
import { publishDomainEvent } from "./domain-events";

type BookingRow = {
  id: string;
  businessId: string;
  customerId: string;
  serviceId: string;
  staffId: string | null;
  source?: string | null;
  sourceConversationId?: string | null;
  startAt: Date;
  status: string;
};

function mapSource(
  source: string | null | undefined,
): EventPayload<"booking.created">["source"] {
  const allowed = [
    "voice",
    "whatsapp",
    "sms",
    "web",
    "walk-in",
    "owner-manual",
    "partner-api",
  ] as const;
  if (source && (allowed as readonly string[]).includes(source)) {
    return source as EventPayload<"booking.created">["source"];
  }
  return "web";
}

export async function emitBookingCreated(
  booking: BookingRow,
  membershipId?: string,
): Promise<void> {
  const payload: EventPayload<"booking.created"> = {
    businessId: booking.businessId,
    bookingId: booking.id,
    customerId: booking.customerId,
    serviceId: booking.serviceId,
    staffId: booking.staffId,
    source: mapSource(booking.source),
    sourceConversationId: booking.sourceConversationId ?? null,
    startAt: new Date(booking.startAt).toISOString(),
  };
  void membershipId;
  await publishDomainEvent(
    "booking.created",
    payload,
    `${booking.businessId}:${booking.id}:created`,
  );

  if (booking.status === "CONFIRMED") {
    await publishDomainEvent(
      "booking.confirmed",
      { businessId: booking.businessId, bookingId: booking.id },
      `${booking.businessId}:${booking.id}:confirmed`,
    );
  }

}

export async function emitBookingStatusChange(
  booking: BookingRow,
  newStatus: string,
  reason?: string | null,
): Promise<void> {
  const base = `${booking.businessId}:${booking.id}`;
  switch (newStatus) {
    case "CONFIRMED":
      await publishDomainEvent(
        "booking.confirmed",
        { businessId: booking.businessId, bookingId: booking.id },
        `${base}:confirmed`,
      );
      break;
    case "CANCELLED":
      await publishDomainEvent(
        "booking.cancelled",
        {
          businessId: booking.businessId,
          bookingId: booking.id,
          reason: reason ?? null,
        },
        `${base}:cancelled`,
      );
      break;
    case "COMPLETED":
      await publishDomainEvent(
        "booking.completed",
        { businessId: booking.businessId, bookingId: booking.id },
        `${base}:completed`,
      );
      break;
    case "NO_SHOW":
      await publishDomainEvent(
        "booking.no-show",
        { businessId: booking.businessId, bookingId: booking.id },
        `${base}:no-show`,
      );
      break;
    default:
      break;
  }
}
