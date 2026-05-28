import { inngest } from "../lib/inngest";
import { tenantContextStore, type TenantContext } from "@workspace/tenant-context";
import { getBookingById } from "../services/bookings.service";
import { ensureBookingGuestAccess } from "../services/booking-guest-access.service";
import { db, businessesTable, customersTable, bookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createTwilioClient } from "@workspace/integrations-twilio";

const DELAY_MS = 24 * 60 * 60 * 1000;

async function runWithTenant<T>(ctx: TenantContext, fn: () => Promise<T>): Promise<T> {
  return tenantContextStore.run(ctx, fn);
}

export const postVisitFeedback = inngest.createFunction(
  { id: "post-visit-feedback", retries: 3 },
  { event: "booking.completed" },
  async ({ event, step }) => {
    const { businessId, bookingId } = event.data as {
      businessId: string;
      bookingId: string;
    };

    const tenantCtx: TenantContext = {
      businessId,
      membershipId: "workflow:post-visit-feedback",
      capabilityToken: "workflow:post-visit-feedback",
      region: "fra",
      locale: "en-IE",
    };

    await step.sleep("wait-24h", DELAY_MS);

    const booking = await step.run("load-booking", () =>
      runWithTenant(tenantCtx, () => getBookingById(businessId, bookingId)),
    );
    if (!booking || booking.status !== "COMPLETED") {
      return { skipped: "not_completed" };
    }

    const [biz] = await db
      .select({
        name: businessesTable.name,
        slug: businessesTable.slug,
        twilioPhoneNumber: businessesTable.twilioPhoneNumber,
      })
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);
    const [cust] = await db
      .select({ phone: customersTable.phone, firstName: customersTable.firstName })
      .from(customersTable)
      .innerJoin(bookingsTable, eq(bookingsTable.customerId, customersTable.id))
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    if (!biz?.slug || !cust?.phone) return { skipped: "no_phone" };

    const token = await step.run("guest-token", () =>
      ensureBookingGuestAccess(businessId, bookingId),
    );

    const base =
      process.env["PUBLIC_BOOKING_BASE_URL"]?.replace(/\/$/, "") ??
      "http://127.0.0.1:5173";
    const link = `${base}/b/${biz.slug}/visit/${token}`;

    const twilioSid = process.env["TWILIO_ACCOUNT_SID"];
    const twilioToken = process.env["TWILIO_AUTH_TOKEN"];
    if (!biz.twilioPhoneNumber || !twilioSid || !twilioToken) {
      return { skipped: "no_twilio", link };
    }

    await step.run("sms-feedback", async () => {
      const twilio = createTwilioClient({ accountSid: twilioSid, authToken: twilioToken });
      const name = cust.firstName?.trim() || "there";
      await twilio.sendSms({
        from: biz.twilioPhoneNumber!,
        to: cust.phone!,
        body: `Hi ${name}, thanks for visiting ${biz.name}. How did we do? Tap to rate 1–5: ${link}`,
      });
    });

    return { sent: true, link };
  },
);
