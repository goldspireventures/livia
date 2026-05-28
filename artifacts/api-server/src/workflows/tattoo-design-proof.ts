import { inngest } from "../lib/inngest";
import { logger } from "../lib/logger";

/** Body art design-proof state machine scaffold (v2). */
export const tattooDesignProofWorkflow = inngest.createFunction(
  { id: "tattoo-design-proof", retries: 2 },
  [{ event: "livia/design-proof.submitted" }, { event: "livia/design-proof.approved" }],
  async ({ event, step }) => {
    const payload = event.data as {
      businessId: string;
      proofId: string;
      customerId?: string | null;
      bookingId?: string | null;
    };
    if (event.name === "livia/design-proof.approved") {
      await step.run("notify-approved", async () => {
        logger.info(payload, "design-proof approved — customer can book session (F6.2)");
        return { status: "approved", bookingId: payload.bookingId };
      });
      return { ok: true, phase: "approved" };
    }
    await step.run("notify-review", async () => {
      logger.info(payload, "design-proof submitted — owner review queue");
      return { status: "pending_review" };
    });
    return { ok: true, phase: "submitted" };
  },
);
