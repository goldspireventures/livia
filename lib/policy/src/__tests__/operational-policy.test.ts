import assert from "node:assert/strict";
import {
  DEFAULT_OPERATIONAL_POLICY,
  customerExemptFromDeposit,
  diffOperationalPolicy,
  explainOperationalPolicySummary,
  mergeOperationalPolicy,
  normalizeDepositPercent,
  parseOperationalPolicy,
} from "../operational-policy";

assert.equal(normalizeDepositPercent("020"), 20);
assert.equal(normalizeDepositPercent(20), 20);
assert.equal(parseOperationalPolicy({ depositPercent: "020" }).depositPercent, 20);

assert.equal(
  customerExemptFromDeposit({
    operational: { depositRequired: true, depositPercent: 20 },
  }),
  false,
  "deposits on — no client exemptions in V1",
);

assert.equal(
  customerExemptFromDeposit({
    operational: { depositRequired: false, depositPercent: 0 },
  }),
  true,
  "deposits off — exempt",
);

assert.equal(
  parseOperationalPolicy({
    depositRequired: true,
    depositPercent: 20,
    requireDepositAfterStrikes: true,
    noShowStrikeThreshold: 2,
  }).depositRequired,
  true,
  "legacy strike fields stripped on parse",
);

const enablingDeposits = mergeOperationalPolicy(
  { depositRequired: true, depositPercent: 20 },
  DEFAULT_OPERATIONAL_POLICY,
);
assert.equal(enablingDeposits.depositRequired, true);
assert.equal(enablingDeposits.depositPercent, 20);

const summary = explainOperationalPolicySummary({
  operational: { ...DEFAULT_OPERATIONAL_POLICY, depositRequired: true, depositPercent: 20 },
  cancelWindowHours: 24,
  depositPolicySummary: "20% deposit for new clients.",
});
assert.ok(summary.headline.includes("20%"));
assert.ok(summary.bullets.some((b) => b.includes("24 hours")));
assert.ok(summary.bullets.some((b) => b.includes("visit patterns")));

const proposed = mergeOperationalPolicy({ lateGraceMinutes: 15 }, DEFAULT_OPERATIONAL_POLICY);
const changes = diffOperationalPolicy(DEFAULT_OPERATIONAL_POLICY, proposed);
assert.equal(changes.length, 1);
assert.equal(changes[0]?.field, "lateGraceMinutes");

console.log("operational-policy.test.ts OK");
