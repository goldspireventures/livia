import assert from "node:assert/strict";
import { evaluateBetaSignup, getBetaSignupMode } from "../../lib/beta-signup-gate";
import { resetWorkforceAccessConfigCache } from "../../lib/workforce-access-env";
import {
  setCockpitWorkforceGrantsCacheForTest,
  invalidateCockpitWorkforceGrantsCache,
} from "../../lib/workforce-access-grants-cache";

const prevMode = process.env.LIVIA_BETA_SIGNUP_MODE;
const prevInvites = process.env.LIVIA_BETA_INVITE_EMAILS;
const prevStaff = process.env.LIVIA_STAFF_EMAIL_DOMAINS;
const prevNodeEnv = process.env.NODE_ENV;

function restore() {
  resetWorkforceAccessConfigCache();
  invalidateCockpitWorkforceGrantsCache();
  setCockpitWorkforceGrantsCacheForTest(null);
  if (prevMode === undefined) delete process.env.LIVIA_BETA_SIGNUP_MODE;
  else process.env.LIVIA_BETA_SIGNUP_MODE = prevMode;
  if (prevInvites === undefined) delete process.env.LIVIA_BETA_INVITE_EMAILS;
  else process.env.LIVIA_BETA_INVITE_EMAILS = prevInvites;
  if (prevStaff === undefined) delete process.env.LIVIA_STAFF_EMAIL_DOMAINS;
  else process.env.LIVIA_STAFF_EMAIL_DOMAINS = prevStaff;
  if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = prevNodeEnv;
}

try {
  delete process.env.LIVIA_BETA_SIGNUP_MODE;
  process.env.NODE_ENV = "development";
  setCockpitWorkforceGrantsCacheForTest(new Map());
  resetWorkforceAccessConfigCache();
  assert.equal(getBetaSignupMode(), "open");
  assert.ok(evaluateBetaSignup("random@test.com").allowed);

  process.env.LIVIA_BETA_SIGNUP_MODE = "invite";
  process.env.LIVIA_BETA_INVITE_EMAILS = "invited@studio.ie";
  resetWorkforceAccessConfigCache();
  assert.ok(!evaluateBetaSignup("other@test.com").allowed);
  assert.ok(evaluateBetaSignup("invited@studio.ie").allowed);
  assert.ok(evaluateBetaSignup("owner-conorcuts@livia.io").allowed);
  assert.ok(evaluateBetaSignup("engineer@livia-hq.com").allowed);
  assert.ok(!evaluateBetaSignup("partner@goldspireventures.com").allowed);

  setCockpitWorkforceGrantsCacheForTest(new Map([["partner@goldspireventures.com", "full"]]));
  assert.ok(evaluateBetaSignup("partner@goldspireventures.com").allowed);

  process.env.NODE_ENV = "production";
  process.env.LIVIA_DEPLOY_ENV = "production";
  delete process.env.LIVIA_BETA_SIGNUP_MODE;
  resetWorkforceAccessConfigCache();
  assert.equal(getBetaSignupMode(), "open");
  assert.ok(evaluateBetaSignup("random@customer.ie").allowed);
  delete process.env.LIVIA_DEPLOY_ENV;
  delete process.env.NODE_ENV;

  process.env.LIVIA_BETA_SIGNUP_MODE = "closed";
  resetWorkforceAccessConfigCache();
  assert.ok(!evaluateBetaSignup("invited@studio.ie").allowed);
  assert.ok(evaluateBetaSignup("owner-conorcuts@livia.io").allowed);
  assert.ok(evaluateBetaSignup("engineer@livia-hq.com").allowed);
  assert.ok(evaluateBetaSignup("partner@goldspireventures.com").allowed);

  setCockpitWorkforceGrantsCacheForTest(new Map());
  assert.ok(!evaluateBetaSignup("partner@goldspireventures.com").allowed);

  console.log("beta-signup-gate.test.ts: ok");
} finally {
  restore();
}
