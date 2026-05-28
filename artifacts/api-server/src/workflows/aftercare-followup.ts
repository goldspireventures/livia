import { inngest } from "../lib/inngest";
import { tenantContextStore, type TenantContext } from "@workspace/tenant-context";
import { getBookingById } from "../services/bookings.service";
import { db, businessesTable, customersTable, bookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createTwilioClient } from "@workspace/integrations-twilio";

const DELAY_MS = 2 * 60 * 60 * 1000;

const AFTERCARE: Record<string, string> = {
  "body-art":
    "Keep the area clean and dry. Avoid swimming for 2 weeks. Reply here if you have redness or swelling concerns.",
  medspa:
    "Avoid sun and active skincare for 48 hours. Contact us if you notice unusual swelling.",
  "allied-health":
    "Follow any exercises we discussed. Ice sore areas 15 min on/off today. Book your next session if you haven't already.",
  wellness:
    "Drink water and rest today. We'd love to see you again — reply to rebook your next session.",
};

async function runWithTenant<T>(ctx: TenantContext, fn: () => Promise<T>): Promise<T> {
  return tenantContextStore.run(ctx, fn);
}

export const aftercareFollowup = inngest.createFunction(
  { id: "aftercare-followup", retries: 2 },
  { event: "booking.completed" },
  async ({ event, step }) => {
    const { businessId, bookingId } = event.data as {
      businessId: string;
      bookingId: string;
    };

    const tenantCtx: TenantContext = {
      businessId,
      membershipId: "workflow:aftercare-followup",
      capabilityToken: "workflow:aftercare-followup",
      region: "fra",
      locale: "en-IE",
    };

    const booking = await step.run("load-booking", () =>
      runWithTenant(tenantCtx, () => getBookingById(businessId, bookingId)),
    );
    if (!booking || booking.status !== "COMPLETED") {
      return { skipped: "not_completed" };
    }

    const [biz] = await db
      .select({
        name: businessesTable.name,
        vertical: businessesTable.vertical,
        twilioPhoneNumber: businessesTable.twilioPhoneNumber,
      })
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);

    const vertical = biz?.vertical ?? "";
    const body = AFTERCARE[vertical];
    if (!body) return { skipped: "vertical" };

    await step.sleep("wait-2h", DELAY_MS);

    const [cust] = await db
      .select({ phone: customersTable.phone, firstName: customersTable.firstName })
      .from(customersTable)
      .innerJoin(bookingsTable, eq(bookingsTable.customerId, customersTable.id))
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    const fromNumber = biz?.twilioPhoneNumber;
    if (!cust?.phone || !fromNumber) return { skipped: "no_phone" };

    const twilioSid = process.env["TWILIO_ACCOUNT_SID"];
    const twilioToken = process.env["TWILIO_AUTH_TOKEN"];
    if (!twilioSid || !twilioToken) return { skipped: "no_twilio" };

    await step.run("sms-aftercare", async () => {
      const twilio = createTwilioClient({ accountSid: twilioSid, authToken: twilioToken });
      const name = cust.firstName?.trim() || "there";
      await twilio.sendSms({
        from: fromNumber,
        to: cust.phone!,
        body: `${biz.name} aftercare: Hi ${name}, ${body}`,
      });
    });

    return { sent: true, vertical };
  },
);
