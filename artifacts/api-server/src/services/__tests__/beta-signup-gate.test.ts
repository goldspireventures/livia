import assert from "node:assert/strict";
import { evaluateBetaSignup, getBetaSignupMode } from "../../lib/beta-signup-gate";

const prevMode = process.env.LIVIA_BETA_SIGNUP_MODE;
const prevInvites = process.env.LIVIA_BETA_INVITE_EMAILS;

function restore() {
  if (prevMode === undefined) delete process.env.LIVIA_BETA_SIGNUP_MODE;
  else process.env.LIVIA_BETA_SIGNUP_MODE = prevMode;
  if (prevInvites === undefined) delete process.env.LIVIA_BETA_INVITE_EMAILS;
  else process.env.LIVIA_BETA_INVITE_EMAILS = prevInvites;
}

try {
  delete process.env.LIVIA_BETA_SIGNUP_MODE;
  assert.equal(getBetaSignupMode(), "open");
  assert.ok(evaluateBetaSignup("random@test.com").allowed);

  process.env.LIVIA_BETA_SIGNUP_MODE = "invite";
  process.env.LIVIA_BETA_INVITE_EMAILS = "invited@studio.ie";
  assert.ok(!evaluateBetaSignup("other@test.com").allowed);
  assert.ok(evaluateBetaSignup("invited@studio.ie").allowed);
  assert.ok(evaluateBetaSignup("owner-conorcuts@livia.io").allowed);

  process.env.LIVIA_BETA_SIGNUP_MODE = "closed";
  assert.ok(!evaluateBetaSignup("invited@studio.ie").allowed);
  assert.ok(evaluateBetaSignup("owner-conorcuts@livia.io").allowed);

  console.log("beta-signup-gate.test.ts: ok");
} finally {
  restore();
}
