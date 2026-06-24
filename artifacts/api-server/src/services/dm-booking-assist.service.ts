import { db, servicesTable } from "@workspace/db";
import {
  guestTimeOfDayLabel,
  parseGuestTimeOfDayPreference,
  pickSlotForGuestPreference,
  resolveGuestBookingDateHint,
} from "@workspace/policy";
import { eq, and } from "drizzle-orm";
import { appendMessage } from "./conversations.service";
import { createBookingViaLiv } from "./liv-booking.service";
import { getAvailableSlots } from "./slots.service";
import { getBusinessById } from "./businesses.service";
import { followUpIntakeAfterBooking } from "./intake-on-book.service";

const BOOK_INTENT =
  /\b(book|appointment|slot|haircut|cut|colour|color|lash|fill|massage|table|session)\b/i;

function formatSlotTime(startAt: string, timezone: string): string {
  return new Date(startAt).toLocaleString("en-IE", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Deterministic WhatsApp book path for dev/E2E and when Anthropic is unavailable.
 * Respects guest day + time-of-day hints when picking a slot.
 */
export async function tryDeterministicWhatsAppBook(args: {
  businessId: string;
  businessSlug: string;
  businessName: string;
  conversationId: string;
  customerId: string;
  customerPhone: string;
  customerName?: string | null;
  messageText: string;
}): Promise<{ bookingId?: string; reply: string } | null> {
  if (!BOOK_INTENT.test(args.messageText)) return null;

  const biz = await getBusinessById(args.businessId);
  if (!biz) return null;

  const timezone = biz.timezone ?? "Europe/Dublin";

  const [service] = await db
    .select({ id: servicesTable.id, name: servicesTable.name })
    .from(servicesTable)
    .where(and(eq(servicesTable.businessId, args.businessId), eq(servicesTable.isActive, true)))
    .limit(1);
  if (!service) return null;

  const timePreference = parseGuestTimeOfDayPreference(args.messageText);
  const date = resolveGuestBookingDateHint(args.messageText, { timezone });
  const slots = await getAvailableSlots({
    businessId: args.businessId,
    serviceId: service.id,
    date,
    timezone,
  });
  const eligible = slots.filter((s) => s.available && s.staffId);
  const slot = pickSlotForGuestPreference(eligible, timePreference, timezone);

  if (!slot?.staffId) {
    if (timePreference && eligible.length > 0) {
      const dateLabel = new Date(`${date}T12:00:00.000Z`).toLocaleDateString("en-IE", {
        timeZone: timezone,
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const alternatives = eligible
        .slice(0, 3)
        .map((s) => formatSlotTime(s.startAt, timezone))
        .join(", ");
      const reply = `No ${guestTimeOfDayLabel(timePreference)} slots on ${dateLabel}. We have ${alternatives}. Reply with a time that works.`;
      await appendMessage({
        conversationId: args.conversationId,
        role: "ASSISTANT",
        content: reply,
      });
      return { reply };
    }
    return null;
  }

  const firstName = (args.customerName ?? "Guest").split(/\s+/)[0] ?? "Guest";
  const created = await createBookingViaLiv({
    businessId: args.businessId,
    conversationId: args.conversationId,
    channelType: "WHATSAPP",
    serviceId: service.id,
    startAt: slot.startAt,
    staffId: slot.staffId,
    customerFirstName: firstName,
    customerPhone: args.customerPhone,
    notes: "Booked via WhatsApp (Liv)",
  });

  void followUpIntakeAfterBooking({
    businessId: args.businessId,
    customerId: created.customerId,
    bookingId: created.bookingId,
    customerPhone: args.customerPhone,
    channelType: "WHATSAPP",
  });

  const when = formatSlotTime(created.startAt, timezone);
  const reply = `You're booked for ${service.name} on ${when} at ${args.businessName}. Reply RESCHEDULE if you need a different time.`;

  await appendMessage({
    conversationId: args.conversationId,
    role: "ASSISTANT",
    content: reply,
  });

  return { bookingId: created.bookingId, reply };
}
