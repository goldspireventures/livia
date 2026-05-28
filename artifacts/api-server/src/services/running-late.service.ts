import { db, bookingsTable, businessesTable, customersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { createTwilioClient } from "@workspace/integrations-twilio";
import { logEvent } from "./events.service";
import { EventType } from "@workspace/db";

export async function notifyBookingRunningLate(
  businessId: string,
  bookingId: string,
  opts: { minutesLate: number; message?: string },
): Promise<{ sent: boolean; phone?: string } | null> {
  const [row] = await db
    .select({
      bookingId: bookingsTable.id,
      status: bookingsTable.status,
      phone: customersTable.phone,
      startAt: bookingsTable.startAt,
      businessName: businessesTable.name,
      twilioPhoneNumber: businessesTable.twilioPhoneNumber,
    })
    .from(bookingsTable)
    .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .innerJoin(businessesTable, eq(bookingsTable.businessId, businessesTable.id))
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, businessId)))
    .limit(1);

  if (!row || row.status !== "CONFIRMED") return null;

  const body =
    opts.message?.trim() ||
    `${row.businessName}: we're running about ${opts.minutesLate} minutes late for your appointment. Thanks for your patience.`;

  const twilioSid = process.env["TWILIO_ACCOUNT_SID"];
  const twilioToken = process.env["TWILIO_AUTH_TOKEN"];
  let sent = false;

  if (row.phone && row.twilioPhoneNumber && twilioSid && twilioToken) {
    const twilio = createTwilioClient({ accountSid: twilioSid, authToken: twilioToken });
    await twilio.sendSms({ from: row.twilioPhoneNumber, to: row.phone, body });
    sent = true;
  }

  await logEvent({
    type: EventType.NOTIFICATION_SENT,
    businessId,
    entityType: "booking",
    entityId: bookingId,
    context: { channel: "sms", template: "running_late", minutesLate: opts.minutesLate, sent },
  });

  return { sent, phone: row.phone ?? undefined };
}
