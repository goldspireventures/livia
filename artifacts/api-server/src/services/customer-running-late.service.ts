import { db, bookingsTable, businessesTable, customersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { logEvent } from "./events.service";
import { EventType } from "@workspace/db";
import { getGuestBookingByToken } from "./booking-guest-access.service";

export async function notifyBusinessCustomerRunningLate(
  slug: string,
  token: string,
  minutesLate: number,
): Promise<{ ok: boolean }> {
  const view = await getGuestBookingByToken(slug, token);
  if (!view) return { ok: false };
  if (view.status !== "CONFIRMED" && view.status !== "PENDING") {
    throw new Error("BOOKING_NOT_ACTIVE");
  }

  const [biz] = await db
    .select({
      name: businessesTable.name,
      phone: businessesTable.phone,
      twilioPhoneNumber: businessesTable.twilioPhoneNumber,
    })
    .from(businessesTable)
    .where(eq(businessesTable.id, view.businessId))
    .limit(1);

  const [cust] = await db
    .select({ firstName: customersTable.firstName, lastName: customersTable.lastName })
    .from(customersTable)
    .innerJoin(bookingsTable, eq(bookingsTable.customerId, customersTable.id))
    .where(eq(bookingsTable.id, view.bookingId))
    .limit(1);

  const customerName = [cust?.firstName, cust?.lastName].filter(Boolean).join(" ").trim() || "Customer";

  await logEvent({
    type: EventType.MESSAGE_RECEIVED,
    businessId: view.businessId,
    entityType: "booking",
    entityId: view.bookingId,
    context: {
      channel: "guest_portal",
      template: "customer_running_late",
      minutesLate,
      customerName,
    },
  });

  const twilioSid = process.env["TWILIO_ACCOUNT_SID"];
  const twilioToken = process.env["TWILIO_AUTH_TOKEN"];
  let sent = false;
  if (biz?.phone && biz.twilioPhoneNumber && twilioSid && twilioToken) {
    const { createTwilioClient } = await import("@workspace/integrations-twilio");
    const twilio = createTwilioClient({ accountSid: twilioSid, authToken: twilioToken });
    const body = `${customerName} says they're about ${minutesLate} min late for ${view.serviceName} at ${new Date(view.startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`;
    await twilio.sendSms({ from: biz.twilioPhoneNumber, to: biz.phone, body });
    sent = true;
  }

  await logEvent({
    type: EventType.NOTIFICATION_SENT,
    businessId: view.businessId,
    entityType: "booking",
    entityId: view.bookingId,
    context: { channel: "sms", template: "customer_running_late", sent, minutesLate },
  });

  return { ok: true };
}
