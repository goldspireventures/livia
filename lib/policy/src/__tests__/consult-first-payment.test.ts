import assert from "node:assert/strict";
import { resolveQuoteMilestonePayment } from "../consult-first-payment";

const quote = {
  subtotalMinor: 100_00,
  depositAmountMinor: 30_00,
  depositPaidMinor: 0,
  milestoneDeposits: [
    { label: "Deposit to secure date", percent: 30, amountMinor: 30_00 },
    { label: "Balance", percent: 70, amountMinor: 70_00, dueDate: "2026-09-08" },
  ],
};

const initial = resolveQuoteMilestonePayment(quote);
assert.equal(initial.nextDueMinor, 30_00);
assert.equal(initial.nextLabel, "Deposit to secure date");
assert.equal(initial.dateSecured, false);

const afterDeposit = resolveQuoteMilestonePayment({ ...quote, depositPaidMinor: 30_00 });
assert.equal(afterDeposit.dateSecured, true);
assert.equal(afterDeposit.milestones[1]?.status, "upcoming");
assert.equal(afterDeposit.nextDueMinor, 0);

const balanceDue = resolveQuoteMilestonePayment({
  ...quote,
  depositPaidMinor: 30_00,
  milestoneDeposits: [
    { label: "Deposit to secure date", percent: 30, amountMinor: 30_00 },
    { label: "Balance", percent: 70, amountMinor: 70_00, dueDate: "2020-01-01" },
  ],
});
assert.equal(balanceDue.nextDueMinor, 70_00);
assert.equal(balanceDue.nextLabel, "Balance");

const fullyPaid = resolveQuoteMilestonePayment({ ...quote, depositPaidMinor: 100_00 });
assert.equal(fullyPaid.nextDueMinor, 0);
assert.equal(fullyPaid.scheduleFullyPaid, true);

console.log("consult-first-payment.test.ts: ok");
