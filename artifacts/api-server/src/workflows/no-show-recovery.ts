import { inngest } from "../lib/inngest";
import { getBookingById } from "../services/bookings.service";
import { logger } from "../lib/logger";
import { tenantContextStore, type TenantContext } from "@workspace/tenant-context";
import { db, businessesTable, customersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createTwilioClient } from "@workspace/integrations-twilio";

const GRACE_MS = 15 * 60 * 1000;

/**
 * No-show recovery scaffold — waits until start+15m, then logs intent.
 * Full deposit charge + DM flow per docs/workflows/no-show.md in Phase 6+.
 */
export const noShowRecovery = inngest.createFunction(
  {
    id: "no-show-recovery",
    retries: 5,
    cancelOn: [
      {
        event: "booking.cancelled",
        match: "data.bookingId",
      },
    ],
  },
  { event: "booking.confirmed" },
  async ({ event, step }) => {
    const data = event.data as { businessId: string; bookingId: string };
    const tenantCtx: TenantContext = {
      businessId: data.businessId,
      membershipId: "workflow:no-show-recovery",
      capabilityToken: "workflow:no-show-recovery",
      region: "fra",
      locale: "en-IE",
    };

    const booking = await step.run("load", async () =>
      tenantContextStore.run(tenantCtx, async () =>
        getBookingById(data.businessId, data.bookingId),
      ),
    );
    if (!booking || typeof booking !== "object" || !("startAt" in booking)) {
      return { skipped: "not_found" };
    }

    const checkAt = new Date(new Date(String(booking.startAt)).getTime() + GRACE_MS);
    if (checkAt.getTime() <= Date.now()) return { skipped: "already_past" };

    await step.sleepUntil("wait-grace", checkAt);

    const fresh = await step.run("reload", async () =>
      tenantContextStore.run(tenantCtx, async () =>
        getBookingById(data.businessId, data.bookingId),
      ),
    );

    if (
      !fresh ||
      typeof fresh !== "object" ||
      !("status" in fresh) ||
      fresh.status === "CANCELLED" ||
      fresh.status === "COMPLETED"
    ) {
      return { skipped: "terminal", status: fresh && "status" in fresh ? fresh.status : null };
    }

    const outreach = await step.run("recovery-sms", async () => {
      const enriched = fresh as {
        customerId?: string;
        service?: { name?: string };
      };
      const [biz] = await db
        .select()
        .from(businessesTable)
        .where(eq(businessesTable.id, data.businessId))
        .limit(1);
      const customerId = enriched.customerId;
      if (!customerId || !biz?.twilioPhoneNumber) {
        return { status: "skipped", reason: "no_phone_or_sender" };
      }
      const [cust] = await db
        .select()
        .from(customersTable)
        .where(eq(customersTable.id, customerId))
        .limit(1);
      if (!cust?.phone) return { status: "skipped", reason: "no_customer_phone" };
      const sid = process.env["TWILIO_ACCOUNT_SID"];
      const token = process.env["TWILIO_AUTH_TOKEN"];
      if (!sid || !token) return { status: "skipped", reason: "no_transport" };
      const body = `${biz.name}: we missed you for your appointment${
        enriched.service?.name ? ` (${enriched.service.name})` : ""
      }. Reply to rebook or let us know what happened.`;
      const twilio = createTwilioClient({ accountSid: sid, authToken: token });
      await twilio.sendSms({ from: biz.twilioPhoneNumber, to: cust.phone, body });
      return { status: "sent" };
    });

    return { bookingId: data.bookingId, phase: "recovery", outreach };
  },
);
