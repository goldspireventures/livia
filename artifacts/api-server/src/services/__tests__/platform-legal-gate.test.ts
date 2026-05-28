import assert from "node:assert/strict";
import {
  buildPlatformLegalAcceptance,
  hasCurrentPlatformLegal,
} from "../../lib/platform-legal-gate";
import { PLATFORM_TOS_VERSION } from "@workspace/policy";

const accepted = buildPlatformLegalAcceptance("sess_test");
assert.ok(hasCurrentPlatformLegal(accepted));
assert.equal(accepted.tosVersion, PLATFORM_TOS_VERSION);

assert.ok(!hasCurrentPlatformLegal(null));
assert.ok(!hasCurrentPlatformLegal({ tosVersion: "old", privacyVersion: "old", acceptedAt: new Date().toISOString() }));

console.log("platform-legal-gate.test.ts: ok");
