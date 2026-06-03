import assert from "node:assert/strict";

process.env.LIVIA_MARKETING_DEMO_GATE_SECRET = "test-gate-secret-for-unit-tests-only";
process.env.LIVIA_MARKETING_DEMO_GATE_BYPASS_KEY = "founder-bypass-test-key";

const { issueMarketingDemoGateToken, verifyMarketingDemoGateToken } = await import(
  "../lib/marketing-demo-gate-token.ts"
);

const token = issueMarketingDemoGateToken({ leadId: "lead-1", email: "owner@studio.ie" });
assert.ok(token);

const ok = verifyMarketingDemoGateToken(token!);
assert.equal(ok.valid, true);
assert.equal(ok.email, "owner@studio.ie");

const bypass = verifyMarketingDemoGateToken("founder-bypass-test-key");
assert.equal(bypass.valid, true);

const bad = verifyMarketingDemoGateToken("not-a-valid-key");
assert.equal(bad.valid, false);

console.log("marketing-demo-gate-token.test.ts: ok");
