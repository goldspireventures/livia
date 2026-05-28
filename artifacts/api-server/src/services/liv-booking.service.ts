import { EventType } from "@workspace/db";
import { LIV_RUNTIME_REF } from "@workspace/liv-runtime";
import { appendAudit } from "../lib/audit";
import { emitBookingCreated } from "../lib/booking-events";
import { recordEvalTraceForTool } from "../lib/eval-traces";
import { recordMeter } from "../lib/metering-recorder";
import { estimateBookingValueEurCents } from "./billing.service";
import { createBooking } from "./bookings.service";
import { findOrCreateCustomer } from "./customers.service";
import { logEvent } from "./events.service";

export type LivBookingChannel =
  | "WEB"
  | "SMS"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "MESSENGER"
  | "VOICE";

/**
 * Single path for Liv create_booking: slot engine (createBooking), audit, meter, eval trace.
 */
export async function createBookingViaLiv(args: {
  businessId: string;
  conversationId: string;
  channelType: LivBookingChannel;
  serviceId: string;
  startAt: string;
  staffId?: string;
  customerFirstName: string;
  customerLastName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}): Promise<{
  bookingId: string;
  status: string;
  startAt: string;
  endAt: string;
  serviceName: string | null;
  staffName: string | null;
  customerId: string;
}> {
  const customer = await findOrCreateCustomer(args.businessId, {
    firstName: args.customerFirstName,
    lastName: args.customerLastName,
    email: args.customerEmail,
    phone: args.customerPhone,
  });

  const booking = await createBooking(args.businessId, {
    serviceId: args.serviceId,
    customerId: customer.id,
    staffId: args.staffId,
    startAt: args.startAt,
    channelType: args.channelType,
    source:
      args.channelType === "VOICE"
        ? "voice"
        : args.channelType === "SMS"
          ? "sms"
          : args.channelType === "WHATSAPP"
            ? "whatsapp"
            : args.channelType === "INSTAGRAM"
              ? "instagram"
              : args.channelType === "MESSENGER"
                ? "messenger"
                : "web",
    sourceConversationId: args.conversationId,
    notes: args.notes,
  });

  await appendAudit({
    businessId: args.businessId,
    actorKind: "liv",
    actorId: LIV_RUNTIME_REF,
    actionClass: "liv.book",
    resourceKind: "booking",
    resourceId: booking.id,
    payload: {
      conversationId: args.conversationId,
      channelType: args.channelType,
      serviceId: args.serviceId,
      customerId: customer.id,
    },
  });

  await recordMeter(args.businessId, "audit_log_event", 1, {
    source: "liv.create_booking",
    bookingId: booking.id,
    conversationId: args.conversationId,
  });

  if (args.channelType === "VOICE") {
    const bookingValueEurCents = await estimateBookingValueEurCents(
      args.businessId,
      args.serviceId,
    );
    await recordMeter(args.businessId, "voice_booking_outcome", 1, {
      bookingId: booking.id,
      bookingValueEurCents,
      conversationId: args.conversationId,
    });
  }

  await logEvent({
    type: EventType.BOOKING_CREATED,
    businessId: args.businessId,
    entityType: "booking",
    entityId: booking.id,
    context: { source: "ai-assistant", conversationId: args.conversationId },
  });

  await emitBookingCreated(
    {
      id: booking.id,
      businessId: args.businessId,
      customerId: customer.id,
      serviceId: args.serviceId,
      staffId: booking.staffId,
      source:
        args.channelType === "VOICE"
          ? "voice"
          : args.channelType === "SMS"
            ? "sms"
            : args.channelType === "WHATSAPP"
              ? "whatsapp"
              : args.channelType === "INSTAGRAM"
                ? "instagram"
                : args.channelType === "MESSENGER"
                  ? "messenger"
                  : "web",
      sourceConversationId: args.conversationId,
      startAt: booking.startAt,
      status: booking.status,
    },
    undefined,
  );

  await recordEvalTraceForTool({
    businessId: args.businessId,
    suite: "liv.book",
    scenario: "create_booking",
    toolName: "create_booking",
    toolInput: {
      serviceId: args.serviceId,
      startAt: args.startAt,
      channelType: args.channelType,
    },
    toolResult: { ok: true, bookingId: booking.id },
  });

  return {
    bookingId: booking.id,
    status: booking.status,
    startAt: booking.startAt.toISOString(),
    endAt: booking.endAt.toISOString(),
    serviceName: booking.service?.name ?? null,
    staffName: booking.staff?.displayName ?? null,
    customerId: customer.id,
  };
}
