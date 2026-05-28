import assert from "node:assert/strict";
import {
  resolveLivDecision,
  mandateDefaultsForVertical,
  simulateMandateScenarios,
  mergeLivMandate,
} from "@workspace/policy";

const hair = mandateDefaultsForVertical("hair");

assert.equal(
  resolveLivDecision({ mandate: { ...hair, rung: "R0" }, action: "reply_inbox" }).outcome,
  "propose",
);
assert.equal(
  resolveLivDecision({ mandate: { ...hair, rung: "R1" }, action: "book_slot" }).outcome,
  "propose",
);

const medspa = mandateDefaultsForVertical("medspa");
assert.equal(medspa.rung, "R1");
assert.equal(
  resolveLivDecision({ mandate: medspa, action: "collect_deposit", valueMinor: 5000 }).outcome,
  "propose",
);

const beautyR2 = mergeLivMandate({ rung: "R2", trustScore: 50 }, mandateDefaultsForVertical("beauty"));
assert.equal(resolveLivDecision({ mandate: beautyR2, action: "reply_inbox" }).outcome, "auto");

const bodySim = simulateMandateScenarios(mandateDefaultsForVertical("body-art"), "body-art");
assert.equal(bodySim.length, 5);
assert.ok(bodySim.some((r) => r.action === "approve_design_proof"));

const hairSim = simulateMandateScenarios(mandateDefaultsForVertical("hair"), "hair");
assert.equal(hairSim.length, 4);
assert.ok(!hairSim.some((r) => r.action === "approve_design_proof"));

const denied = mergeLivMandate(
  { rung: "R4", deniedActions: ["cancel_booking"] },
  mandateDefaultsForVertical("hair"),
);
assert.equal(resolveLivDecision({ mandate: denied, action: "cancel_booking" }).outcome, "refuse");

console.log("liv-mandate.test.ts: ok");
