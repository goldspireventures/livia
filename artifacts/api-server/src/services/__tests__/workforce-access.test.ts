import {
  isCockpitGrantableGoldspireEmail,
  resolveWorkforceAccessTier,
  workforceAccessConfigFromEnv,
  workforceAllowsBetaSignup,
} from "@workspace/policy";
import assert from "node:assert/strict";

const config = workforceAccessConfigFromEnv({});
const grants = new Map<string, "full">([["partner@goldspireventures.com", "full"]]);

assert.equal(resolveWorkforceAccessTier("engineer@livia-hq.com", config), "restricted");
assert.equal(resolveWorkforceAccessTier("partner@goldspireventures.com", config), "none");
assert.equal(resolveWorkforceAccessTier("partner@goldspireventures.com", config, grants), "full");
assert.equal(resolveWorkforceAccessTier("customer@studio.ie", config), "none");

assert.ok(workforceAllowsBetaSignup("engineer@livia-hq.com", config));
assert.ok(!workforceAllowsBetaSignup("partner@goldspireventures.com", config));
assert.ok(workforceAllowsBetaSignup("partner@goldspireventures.com", config, grants));

assert.ok(isCockpitGrantableGoldspireEmail("x@goldspireventures.com", config));
assert.ok(!isCockpitGrantableGoldspireEmail("x@livia-hq.com", config));

console.log("workforce-access.test.ts: ok");
