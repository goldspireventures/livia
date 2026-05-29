import assert from "node:assert/strict";
import { isBusinessApiFeatureAllowed } from "@workspace/policy";

assert.ok(isBusinessApiFeatureAllowed("medspa", "medspa"));
assert.ok(!isBusinessApiFeatureAllowed("medspa", "hair"));
assert.ok(isBusinessApiFeatureAllowed("class-sessions", "fitness"));
assert.ok(!isBusinessApiFeatureAllowed("class-sessions", "hair"));
assert.ok(isBusinessApiFeatureAllowed("design-proofs", "body-art"));
assert.ok(isBusinessApiFeatureAllowed("unknown-feature", "hair"));

console.log("wedge-api-gate.test.ts: ok");
