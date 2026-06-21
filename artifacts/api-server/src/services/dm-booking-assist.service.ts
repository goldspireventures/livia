import { db, servicesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { appendMessage } from "./conversations.service";
import { createBookingViaLiv } from "./liv-booking.service";
import { getAvailableSlots } from "./slots.service";
import { getBusinessById } from "./businesses.service";
import { followUpIntakeAfterBooking } from "./intake-on-book.service";

const BOOK_INTENT =
  /\b(book|appointment|slot|haircut|cut|colour|color|lash|fill|massage|table|session)\b/i;

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Deterministic WhatsApp book path for dev/E2E and when Anthropic is unavailable.
 * Finds first available slot tomorrow and confirms in-thread.
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
}): Promise<{ bookingId: string; reply: string } | null> {
  if (!BOOK_INTENT.test(args.messageText)) return null;

  const biz = await getBusinessById(args.businessId);
  if (!biz) return null;

  const [service] = await db
    .select({ id: servicesTable.id, name: servicesTable.name })
    .from(servicesTable)
    .where(and(eq(servicesTable.businessId, args.businessId), eq(servicesTable.isActive, true)))
    .limit(1);
  if (!service) return null;

  const date = tomorrowIso();
  const slots = await getAvailableSlots({
    businessId: args.businessId,
    serviceId: service.id,
    date,
    timezone: biz.timezone ?? "Europe/Dublin",
  });
  const slot = slots.find((s) => s.available && s.staffId);
  if (!slot?.staffId) return null;

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

  const when = new Date(created.startAt).toLocaleString("en-IE", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const reply = `You're booked for ${service.name} on ${when} at ${args.businessName}. Reply RESCHEDULE if you need a different time.`;

  await appendMessage({
    conversationId: args.conversationId,
    role: "ASSISTANT",
    content: reply,
  });

  return { bookingId: created.bookingId, reply };
}
