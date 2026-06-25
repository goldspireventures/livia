import assert from "node:assert/strict";
import {
  isOnLivArrivalPath,
  isPlatformTourDismissed,
  readLivArrivalDismissed,
  shouldShowLivArrivalConductor,
  shouldSuppressDuplicateSetupBanners,
  writeLivArrivalDismissed,
  PLATFORM_TOUR_DISMISSED_KEY,
  LIV_ARRIVAL_DISMISSED_KEY,
} from "../liv-arrival-program";

const baseArgs = {
  activation: { sacredMetricMet: false },
  onboardingState: { completedActs: ["a1"], percentComplete: 40 },
  vertical: "beauty",
  slug: "kinvara-salon",
  isDemoTenant: false,
  isOwnerOrAdmin: true,
  arrivalDismissed: false,
  platformTourDismissed: true,
};

assert.equal(isOnLivArrivalPath(baseArgs), true);
assert.equal(shouldSuppressDuplicateSetupBanners(baseArgs), true);
assert.equal(shouldShowLivArrivalConductor(baseArgs), true);

assert.equal(
  shouldShowLivArrivalConductor({ ...baseArgs, platformTourDismissed: false }),
  false,
);
assert.equal(
  shouldShowLivArrivalConductor({ ...baseArgs, arrivalDismissed: true }),
  false,
);
assert.equal(
  isOnLivArrivalPath({ ...baseArgs, activation: { sacredMetricMet: true } }),
  false,
);
assert.equal(isOnLivArrivalPath({ ...baseArgs, isOwnerOrAdmin: false }), false);

const mem = new Map<string, string>();
const storage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => {
    mem.set(k, v);
  },
} as Storage;

writeLivArrivalDismissed("biz-1", storage);
assert.equal(readLivArrivalDismissed("biz-1", storage), true);
assert.equal(readLivArrivalDismissed("biz-2", storage), false);

mem.set(PLATFORM_TOUR_DISMISSED_KEY, "1");
assert.equal(isPlatformTourDismissed(storage), true);

console.log("liv-arrival-program.test.ts OK");
