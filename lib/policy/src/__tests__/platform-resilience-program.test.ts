import assert from "node:assert/strict";
import {
  isSubsystemEnabled,
  resolveSideEffectMode,
  SIDE_EFFECT_CIRCUIT_DEFAULTS,
} from "../platform-resilience-program";

assert.equal(resolveSideEffectMode({ LIVIA_SIDE_EFFECTS_MODE: "disabled" }), "disabled");
assert.equal(resolveSideEffectMode({ LIVIA_NOTIFICATIONS_DISABLED: "true" }), "disabled");
assert.equal(resolveSideEffectMode({ LIVIA_SIDE_EFFECTS_MODE: "in_app_only" }), "in_app_only");
assert.equal(resolveSideEffectMode({}), "full");

assert.equal(isSubsystemEnabled("notifications", "disabled"), false);
assert.equal(isSubsystemEnabled("push", "disabled"), false);
assert.equal(isSubsystemEnabled("notifications", "in_app_only"), true);
assert.equal(isSubsystemEnabled("push", "in_app_only"), false);
assert.equal(isSubsystemEnabled("workflows", "full"), true);
assert.equal(isSubsystemEnabled("messaging_outbound", "full"), true);
assert.equal(isSubsystemEnabled("messaging_outbound", "in_app_only"), false);
assert.equal(isSubsystemEnabled("messaging_inbound", "disabled"), false);

assert.equal(SIDE_EFFECT_CIRCUIT_DEFAULTS.failureThreshold, 5);

console.log("platform-resilience-program.test.ts: ok");
