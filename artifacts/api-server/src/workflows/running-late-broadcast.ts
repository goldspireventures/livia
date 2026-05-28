import { inngest } from "../lib/inngest";
import { db, bookingsTable, businessesTable, customersTable } from "@workspace/db";
import { and, eq, gte, lte } from "drizzle-orm";
import { createTwilioClient } from "@workspace/integrations-twilio";
import { logger } from "../lib/logger";

/**
 * Owner triggers running-late broadcast for today's confirmed bookings (Scenario 07).
 */
export const runningLateBroadcast = inngest.createFunction(
  { id: "running-late-broadcast", retries: 2 },
  { event: "livia/running-late.broadcast" },
  async ({ event, step }) => {
    const data = event.data as {
      businessId: string;
      minutesLate: number;
      message?: string;
    };
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const rows = await step.run("load-today-bookings", async () =>
      db
        .select({
          bookingId: bookingsTable.id,
          phone: customersTable.phone,
          startAt: bookingsTable.startAt,
        })
        .from(bookingsTable)
        .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
        .where(
          and(
            eq(bookingsTable.businessId, data.businessId),
            eq(bookingsTable.status, "CONFIRMED"),
            gte(bookingsTable.startAt, startOfDay),
            lte(bookingsTable.startAt, endOfDay),
          ),
        ),
    );

    const [biz] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, data.businessId))
      .limit(1);

    const body =
      data.message?.trim() ||
      `${biz?.name ?? "Your appointment"}: we're running about ${data.minutesLate} minutes late today. Thanks for your patience.`;

    const twilioSid = process.env["TWILIO_ACCOUNT_SID"];
    const twilioToken = process.env["TWILIO_AUTH_TOKEN"];
    let sent = 0;

    if (biz?.twilioPhoneNumber && twilioSid && twilioToken) {
      await step.run("sms-batch", async () => {
        const twilio = createTwilioClient({ accountSid: twilioSid, authToken: twilioToken });
        for (const row of rows) {
          if (!row.phone) continue;
          await twilio.sendSms({ from: biz.twilioPhoneNumber!, to: row.phone!, body });
          sent += 1;
        }
        return { sent };
      });
    } else {
      logger.info({ businessId: data.businessId, count: rows.length }, "running-late: no SMS transport");
    }

    return { notified: sent, candidates: rows.length };
  },
);
