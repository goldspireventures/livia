import { inngest } from "../lib/inngest";
import { db, morningBriefingsTable, businessesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { todayInTimezone } from "@workspace/liv-runtime";
import {
  generateMorningBriefingForBusiness,
  type MorningBriefingContent,
} from "../services/morning-briefing.service";
import { logger } from "../lib/logger";

const BOOKING_EVENTS = [
  "booking.created",
  "booking.confirmed",
  "booking.cancelled",
  "booking.no-show",
] as const;

/**
 * When the day’s operational picture changes, refresh today’s morning briefing
 * so Liv’s ritual line stays aligned with facts (JARVIS observes → narrates).
 */
export const livBriefingRefresh = inngest.createFunction(
  {
    id: "liv-briefing-refresh",
    retries: 2,
    debounce: {
      period: "10m",
      key: "event.data.businessId",
    },
  },
  BOOKING_EVENTS.map((event) => ({ event })),
  async ({ event, step }) => {
    const data = event.data as { businessId: string; bookingId?: string };

    const refreshed = await step.run("refresh-today-briefing", async () => {
      const [biz] = await db
        .select({ timezone: businessesTable.timezone })
        .from(businessesTable)
        .where(eq(businessesTable.id, data.businessId));
      if (!biz) return { skipped: "business_not_found" };

      const briefingDate = todayInTimezone(biz.timezone);
      const [existing] = await db
        .select({ id: morningBriefingsTable.id })
        .from(morningBriefingsTable)
        .where(
          and(
            eq(morningBriefingsTable.businessId, data.businessId),
            eq(morningBriefingsTable.briefingDate, briefingDate),
          ),
        );

      if (!existing) {
        return { skipped: "no_briefing_yet", briefingDate };
      }

      const row = await generateMorningBriefingForBusiness(data.businessId);
      const source = (row?.content as MorningBriefingContent | undefined)?.source;
      logger.info(
        { businessId: data.businessId, bookingId: data.bookingId, source },
        "liv briefing refreshed after booking event",
      );
      return { ok: !!row, source, briefingDate };
    });

    return refreshed;
  },
);
