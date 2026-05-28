import { inngest } from "../lib/inngest";
import { db, businessesTable } from "@workspace/db";
import {
  generateMorningBriefingForBusiness,
  isMorningBriefingHour,
} from "../services/morning-briefing.service";
import { publishDomainEvent } from "../lib/domain-events";
import { logger } from "../lib/logger";

/**
 * Hourly cron: generate morning briefing for tenants where local time is 06:00.
 */
export const morningBriefingCron = inngest.createFunction(
  { id: "morning-briefing-cron", retries: 2 },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const businesses = await step.run("list-businesses", async () =>
      db
        .select({ id: businessesTable.id, timezone: businessesTable.timezone })
        .from(businessesTable),
    );

    let generated = 0;
    for (const biz of businesses) {
      if (!isMorningBriefingHour(biz.timezone)) continue;

      await step.run(`briefing-${biz.id}`, async () => {
        const row = await generateMorningBriefingForBusiness(biz.id);
        if (row) {
          await publishDomainEvent(
            "morning.briefing.ready",
            {
              businessId: biz.id,
              briefingDate: row.briefingDate,
              briefingId: row.id,
            },
            `${biz.id}:morning-briefing:${row.briefingDate}`,
          ).catch(() => undefined);
          logger.info({ businessId: biz.id }, "morning briefing generated");
        }
        return { businessId: biz.id, ok: !!row };
      });
      generated += 1;
    }

    return { checked: businesses.length, generated };
  },
);
