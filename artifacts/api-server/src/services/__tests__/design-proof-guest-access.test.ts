import { guestSurfaceByType } from "@workspace/policy";
import assert from "node:assert/strict";

const proof = guestSurfaceByType("proof");
assert.ok(proof);
assert.equal(proof.routePattern, "/proof/:token");
assert.equal(proof.tokenRequired, true);
assert.equal(proof.defaultTtlHours, 168);
assert.ok(Array.isArray(proof.verticals) && proof.verticals.includes("body-art"));

console.log("design-proof-guest-access.test.ts: ok");
