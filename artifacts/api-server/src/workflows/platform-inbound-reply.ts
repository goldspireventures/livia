import { inngest } from "../lib/inngest";
import type { InboundReplyJob } from "@workspace/policy";
import { executeInboundReply } from "../services/inbound-reply.service";

/** Async Liv reply after inbound message persisted — decoupled from webhook ACK. */
export const platformInboundReply = inngest.createFunction(
  { id: "platform-inbound-reply", retries: 3 },
  { event: "livia/platform.inbound.reply" },
  async ({ event, step }) => {
    const job = event.data.job as InboundReplyJob;
    const result = await step.run("liv-reply-and-send", async () => executeInboundReply(job));
    return { ok: true, ...result };
  },
);
