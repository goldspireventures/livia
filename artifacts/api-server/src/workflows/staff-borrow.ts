import { inngest } from "../lib/inngest";
import { logger } from "../lib/logger";

/**
 * Cross-shop staff borrow (C7 chains) — event-driven scaffold.
 * Emit `livia/staff-borrow.requested` from dashboard when implemented.
 */
export const staffBorrowWorkflow = inngest.createFunction(
  { id: "staff-borrow", retries: 2 },
  { event: "livia/staff-borrow.requested" },
  async ({ event, step }) => {
    const { hostBusinessId, staffId, targetBusinessId, from, to } = event.data as {
      hostBusinessId: string;
      staffId: string;
      targetBusinessId: string;
      from: string;
      to: string;
    };

    await step.run("log-borrow", async () => {
      logger.info(
        { hostBusinessId, staffId, targetBusinessId, from, to },
        "staff-borrow requested (approval + calendar sync v1.5+)",
      );
      return { status: "logged" };
    });

    return { ok: true };
  },
);
