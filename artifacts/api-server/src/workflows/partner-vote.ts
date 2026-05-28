import { inngest } from "../lib/inngest";
import { logger } from "../lib/logger";

/** C12 partner vote workflow — event-driven scaffold (ADR pending full UI). */
export const partnerVoteWorkflow = inngest.createFunction(
  { id: "partner-vote", retries: 2 },
  { event: "livia/partner-vote.submitted" },
  async ({ event, step }) => {
    const payload = event.data as {
      businessId: string;
      partnerId: string;
      vote: "yes" | "no" | "abstain";
    };
    await step.run("record-vote", async () => {
      logger.info(payload, "partner-vote submitted (tally + notify v1.5+)");
      return { recorded: true };
    });
    return { ok: true };
  },
);
