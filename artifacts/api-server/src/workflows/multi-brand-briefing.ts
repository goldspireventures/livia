import { inngest } from "../lib/inngest";
import { logger } from "../lib/logger";

/** Sunday 07:00 UTC — portfolio rollup for multi-brand founders (C13). */
export const multiBrandBriefing = inngest.createFunction(
  { id: "multi-brand-briefing", retries: 2 },
  { cron: "0 7 * * 0" },
  async ({ step }) => {
    await step.run("portfolio-scaffold", async () => {
      logger.info("multi-brand-briefing: scaffold (per-brand digest + portfolio email v1.5+)");
      return { status: "scaffold" };
    });
    return { ok: true };
  },
);
