import { inngest } from "../lib/inngest";
import { getBookingById } from "../services/bookings.service";
import {
  popNextWaitlistCandidate,
  markWaitlistOffered,
  resolveWaitlistContact,
} from "../services/waitlist.service";
import { logger } from "../lib/logger";
import { tenantContextStore, type TenantContext } from "@workspace/tenant-context";
import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createTwilioClient } from "@workspace/integrations-twilio";

/**
 * When a booking is cancelled, offer the freed slot to the next waitlist entry (FIFO).
 */
export const waitlistOfferOnCancel = inngest.createFunction(
  { id: "waitlist-offer-on-cancel", retries: 3 },
  { event: "booking.cancelled" },
  async ({ event, step }) => {
    const data = event.data as { businessId: string; bookingId: string };
    const tenantCtx: TenantContext = {
      businessId: data.businessId,
      membershipId: "workflow:waitlist-offer",
      capabilityToken: "workflow:waitlist-offer",
      region: "fra",
      locale: "en-IE",
    };

    const booking = await step.run("load-cancelled", async () =>
      tenantContextStore.run(tenantCtx, async () =>
        getBookingById(data.businessId, data.bookingId),
      ),
    );

    if (
      !booking ||
      typeof booking !== "object" ||
      !("serviceId" in booking) ||
      !booking.serviceId
    ) {
      return { skipped: "no_booking" };
    }

    const entry = await step.run("pop-waitlist", async () =>
      popNextWaitlistCandidate({
        businessId: data.businessId,
        serviceId: String(booking.serviceId),
        staffId: booking.staffId ? String(booking.staffId) : undefined,
      }),
    );

    if (!entry) return { skipped: "empty_waitlist" };

    await step.run("mark-offered", async () =>
      markWaitlistOffered(entry.id, data.bookingId),
    );

    const contact = await step.run("resolve-contact", async () =>
      resolveWaitlistContact(entry),
    );

    const [biz] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, data.businessId))
      .limit(1);

    const body = [
      `${biz?.name ?? "Your clinic"}: a slot opened up for a service you wanted.`,
      "Reply YES within 2 hours to hold it — we'll follow up to confirm time.",
    ].join(" ");

    const twilioSid = process.env["TWILIO_ACCOUNT_SID"];
    const twilioToken = process.env["TWILIO_AUTH_TOKEN"];
    const toPhone = typeof contact.phone === "string" ? contact.phone : null;
    if (toPhone && biz?.twilioPhoneNumber && twilioSid && twilioToken) {
      await step.run("sms-offer", async () => {
        const twilio = createTwilioClient({ accountSid: twilioSid, authToken: twilioToken });
        await twilio.sendSms({
          from: biz.twilioPhoneNumber!,
          to: toPhone,
          body,
        });
      });
    } else {
      logger.info(
        { businessId: data.businessId, waitlistId: entry.id },
        "waitlist-offer: no phone — logged only",
      );
    }

    return { offered: entry.id, bookingId: data.bookingId };
  },
);
