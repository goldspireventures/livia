import { syncTwinObservations } from "./twin-observations.service";
import { invalidateOwnerIntelligenceCache } from "./owner-intelligence-cache";
import { logger } from "../lib/logger";

export type TwinIntelligenceDailyResult = {
  businessId: string;
  observationsCreated: number;
};

/** Nightly twin re-materialize — refresh observation store + bust owner-intel cache. */
export async function runTwinIntelligenceDaily(
  businessId: string,
): Promise<TwinIntelligenceDailyResult> {
  const observationsCreated = await syncTwinObservations(businessId);
  invalidateOwnerIntelligenceCache(businessId);

  if (observationsCreated > 0) {
    logger.info({ businessId, observationsCreated }, "twin intelligence daily sync");
  }

  return { businessId, observationsCreated };
}
