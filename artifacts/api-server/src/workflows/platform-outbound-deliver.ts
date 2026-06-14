import { inngest } from "../lib/inngest";
import type { OutboundDeliveryJob } from "@workspace/policy";
import { executeOutboundDelivery } from "../services/outbound-delivery.service";

/** Async, retryable SMS/email transport — thread already persisted. */
export const platformOutboundDeliver = inngest.createFunction(
  { id: "platform-outbound-deliver", retries: 3 },
  { event: "livia/platform.outbound.deliver" },
  async ({ event, step }) => {
    const job = event.data.job as OutboundDeliveryJob;
    const status = await step.run("deliver-channel", async () => executeOutboundDelivery(job));
    return { ok: status === "SENT", status };
  },
);
