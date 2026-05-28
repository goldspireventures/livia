import { inngest } from "../lib/inngest";
import { getBookingById } from "../services/bookings.service";
import { sendBookingReminderEmail } from "../services/booking-emails.service";
import { recordWorkflowPause } from "../lib/workflow-pause";
import { tenantContextStore, type TenantContext } from "@workspace/tenant-context";

const REMINDER_MS = 24 * 60 * 60 * 1000;

async function runWithTenant<T>(ctx: TenantContext, fn: () => Promise<T>): Promise<T> {
  return tenantContextStore.run(ctx, fn);
}

export const bookingReminderT24 = inngest.createFunction(
  {
    id: "booking-reminder-t24",
    retries: 5,
    cancelOn: [
      {
        event: "booking.cancelled",
        match: "data.bookingId",
      },
    ],
    onFailure: async ({ event, error }) => {
      const data = event.data as { businessId?: string };
      if (data.businessId) {
        await recordWorkflowPause(
          data.businessId,
          "booking-reminder-t24",
          error.message ?? "workflow failed",
        );
      }
    },
  },
  [{ event: "booking.created" }, { event: "booking.confirmed" }],
  async ({ event, step }) => {
    const data = event.data as {
      businessId: string;
      bookingId: string;
      membershipId?: string;
    };

    const tenantCtx: TenantContext = {
      businessId: data.businessId,
      membershipId: data.membershipId ?? "workflow:booking-reminder-t24",
      capabilityToken: "workflow:booking-reminder-t24",
      region: "fra",
      locale: "en-IE",
    };

    const booking = await step.run("load-booking", () =>
      runWithTenant(tenantCtx, async () => getBookingById(data.businessId, data.bookingId)),
    );

    if (!booking) return { skipped: "booking_not_found" };
    if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
      return { skipped: "status", status: booking.status };
    }

    const startAt = new Date(booking.startAt);
    const reminderAt = new Date(startAt.getTime() - REMINDER_MS);
    if (reminderAt.getTime() <= Date.now()) {
      return { skipped: "reminder_in_past" };
    }

    await step.sleepUntil("wait-until-t24", reminderAt);

    const fresh = await step.run("reload-booking", () =>
      runWithTenant(tenantCtx, async () => getBookingById(data.businessId, data.bookingId)),
    );

    if (!fresh || fresh.status === "CANCELLED") {
      return { skipped: "cancelled_before_send" };
    }

    await step.run("send-reminder-email", () =>
      runWithTenant(tenantCtx, async () =>
        sendBookingReminderEmail({
          business: data.businessId,
          booking: fresh as unknown as Parameters<typeof sendBookingReminderEmail>[0]["booking"],
        }),
      ),
    );

    return { sent: true, bookingId: data.bookingId };
  },
);
