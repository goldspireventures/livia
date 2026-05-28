import { inngest } from "../lib/inngest";
import { logger } from "../lib/logger";

/** T-24h class reminder scaffold (v2 fitness). */
export const classSessionReminder = inngest.createFunction(
  { id: "class-session-reminder", retries: 2 },
  { event: "livia/class-session.scheduled" },
  async ({ event, step }) => {
    const { businessId, sessionId, startsAt } = event.data as {
      businessId: string;
      sessionId: string;
      startsAt: string;
    };
    await step.run("reminder-scaffold", async () => {
      logger.info({ businessId, sessionId, startsAt }, "class-session-reminder scaffold");
      return { ok: true };
    });
    return { ok: true };
  },
);
