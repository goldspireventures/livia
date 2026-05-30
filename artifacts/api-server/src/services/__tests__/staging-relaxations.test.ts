import assert from "node:assert/strict";
import {
  guestOtpCodeMatches,
  normalizeGuestHubPhone,
  resolveStagingRelaxations,
} from "@workspace/policy";

const staging = {
  NODE_ENV: "production",
  LIVIA_DEPLOY_ENV: "staging",
};

assert.equal(resolveStagingRelaxations(staging).active, true);
assert.equal(resolveStagingRelaxations(staging).guestHub.otpMode, "bypass");
assert.equal(resolveStagingRelaxations(staging).guestHub.phoneMode, "loose");
assert.equal(resolveStagingRelaxations(staging).guestHub.magicOtpCode, "000000");

assert.equal(
  resolveStagingRelaxations({ ...staging, LIVIA_STAGING_RELAXED: "false" }).active,
  false,
);
assert.equal(
  resolveStagingRelaxations({ ...staging, LIVIA_STAGING_RELAXED: "false" }).guestHub.otpMode,
  "strict",
);

assert.equal(
  resolveStagingRelaxations({
    ...staging,
    LIVIA_STAGING_RELAX_GUEST_OTP: "strict",
  }).guestHub.otpMode,
  "strict",
);

assert.equal(
  resolveStagingRelaxations({ NODE_ENV: "development" }).guestHub.otpMode,
  "dev",
);

assert.equal(
  resolveStagingRelaxations({ NODE_ENV: "production" }).active,
  false,
);

const loosePhone = normalizeGuestHubPhone("12345", "IE", "loose");
assert.ok(loosePhone?.startsWith("+1999"));

assert.ok(guestOtpCodeMatches("111111", "000000", "bypass", "000000"));
assert.ok(!guestOtpCodeMatches("111111", "999999", "strict", null));

console.log("staging-relaxations.test.ts: ok");
