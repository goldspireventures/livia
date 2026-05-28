import { inngest } from "../lib/inngest";
import { runBookingContinuityBridge } from "../services/booking-continuity.service";
import { recordWorkflowPause } from "../lib/workflow-pause";
import { tenantContextStore, type TenantContext } from "@workspace/tenant-context";

async function runWithTenant<T>(ctx: TenantContext, fn: () => Promise<T>): Promise<T> {
  return tenantContextStore.run(ctx, fn);
}

export const bookingContinuityBridge = inngest.createFunction(
  {
    id: "booking-continuity-bridge",
    retries: 4,
    onFailure: async ({ event, error }) => {
      const data = event.data as { businessId?: string };
      if (data.businessId) {
        await recordWorkflowPause(
          data.businessId,
          "booking-continuity-bridge",
          error.message ?? "workflow failed",
        );
      }
    },
  },
  { event: "booking.created" },
  async ({ event, step }) => {
    const data = event.data as {
      businessId: string;
      bookingId: string;
      source?: string;
    };

    if (data.source && data.source !== "web") {
      return { skipped: "not_web_source", source: data.source };
    }

    const tenantCtx: TenantContext = {
      businessId: data.businessId,
      membershipId: "workflow:booking-continuity-bridge",
      capabilityToken: "workflow:booking-continuity-bridge",
      region: "fra",
      locale: "en-IE",
    };

    const result = await step.run("continuity-bridge", () =>
      runWithTenant(tenantCtx, () =>
        runBookingContinuityBridge(data.businessId, data.bookingId),
      ),
    );

    return result;
  },
);
