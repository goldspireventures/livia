/**
 * Monthly voice outcome settlement scaffold (Phase 2).
 * Full Inngest job lands in Phase 3; internal cron can invoke this sweep.
 */
import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { resolveBillingState } from "./billing.service";
import { logger } from "../lib/logger";

export type SettlementRow = {
  businessId: string;
  planId: string;
  voiceOutcomeShareEurCents: number;
  voiceOutcomeCapEurCents: number | null;
  bookingCompletedCount: number;
};

export async function runVoiceSettlementSweep(): Promise<{
  businesses: number;
  rows: SettlementRow[];
}> {
  const businesses = await db
    .select({ id: businessesTable.id })
    .from(businessesTable);

  const rows: SettlementRow[] = [];

  for (const { id } of businesses) {
    try {
      const state = await resolveBillingState(id);
      if (state.voiceOutcomeShareRate <= 0) continue;

      rows.push({
        businessId: id,
        planId: state.planId,
        voiceOutcomeShareEurCents: state.voiceOutcomeShareEurCents,
        voiceOutcomeCapEurCents: state.voiceOutcomeCapEurCents,
        bookingCompletedCount: state.usage.booking_completed ?? 0,
      });
    } catch (err) {
      logger.warn({ err, businessId: id }, "settlement row skipped");
    }
  }

  logger.info({ count: rows.length }, "voice settlement sweep complete");
  return { businesses: businesses.length, rows };
}
