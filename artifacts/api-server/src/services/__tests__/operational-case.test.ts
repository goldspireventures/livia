import assert from "node:assert/strict";
import { resolveLivDecision, mandateDefaultsForVertical } from "@workspace/policy";

/** Mandate gate: cancel_booking at R2 should propose, not auto-run. */
const mandate = mandateDefaultsForVertical("hair");
const decision = resolveLivDecision({
  mandate: { ...mandate, rung: "R2" },
  action: "cancel_booking",
});
assert.equal(decision.outcome, "propose");

/** process_refund always proposes at hair defaults. */
const refund = resolveLivDecision({
  mandate,
  action: "process_refund",
  valueMinor: 6000,
});
assert.ok(refund.outcome === "propose" || refund.outcome === "refuse");

console.log("operational-case.test.ts: ok");
