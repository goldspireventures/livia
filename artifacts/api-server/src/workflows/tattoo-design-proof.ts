import { inngest } from "../lib/inngest";
import { logger } from "../lib/logger";

type ProofEventPayload = {
  businessId: string;
  proofId: string;
  customerId?: string | null;
  bookingId?: string | null;
  source?: "studio" | "guest";
};

/** Body art design-proof lifecycle — notifications owned by design-proofs.service; workflow for async follow-up. */
export const tattooDesignProofWorkflow = inngest.createFunction(
  { id: "tattoo-design-proof", retries: 2 },
  [
    { event: "livia/design-proof.submitted" },
    { event: "livia/design-proof.approved" },
    { event: "livia/design-proof.rejected" },
  ],
  async ({ event, step }) => {
    const payload = event.data as ProofEventPayload;

    if (event.name === "livia/design-proof.approved") {
      await step.run("log-approved", async () => {
        logger.info(payload, "design-proof approved — session/deposit path unlocked");
        return { status: "approved", bookingId: payload.bookingId };
      });
      return { ok: true, phase: "approved" };
    }

    if (event.name === "livia/design-proof.rejected") {
      await step.run("log-rejected", async () => {
        logger.info(payload, "design-proof changes requested — studio revision queue");
        return { status: "rejected", source: payload.source ?? "guest" };
      });
      return { ok: true, phase: "rejected" };
    }

    await step.run("log-submitted", async () => {
      logger.info(payload, "design-proof sent to client for review");
      return { status: "pending_review" };
    });
    return { ok: true, phase: "submitted" };
  },
);
