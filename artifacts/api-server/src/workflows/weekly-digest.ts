import { inngest } from "../lib/inngest";
import { db, businessesTable } from "@workspace/db";
import { sendWeeklyDigestEmail } from "../services/weekly-digest.service";
import { logger } from "../lib/logger";

/**
 * Weekly digest — Sunday 18:00 UTC (per-business TZ refinement later).
 */
export const weeklyDigest = inngest.createFunction(
  { id: "weekly-digest", retries: 3 },
  { cron: "0 18 * * 0" },
  async ({ step }) => {
    const businesses = await step.run("list-businesses", async () =>
      db.select({ id: businessesTable.id, name: businessesTable.name }).from(businessesTable),
    );

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const biz of businesses) {
      const result = await step.run(`digest-${biz.id}`, async () => {
        const status = await sendWeeklyDigestEmail(biz.id);
        return { businessId: biz.id, status };
      });
      if (result.status === "sent") sent += 1;
      else if (result.status === "failed") failed += 1;
      else skipped += 1;
    }

    if (failed > 0) {
      logger.warn({ failed }, "weekly-digest: some emails failed");
    }

    return { processed: businesses.length, sent, skipped, failed };
  },
);
