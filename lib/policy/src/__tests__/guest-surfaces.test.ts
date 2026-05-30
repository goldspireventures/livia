import assert from "node:assert/strict";
import { guestSurfaceByType } from "../guest-surfaces";

const visit = guestSurfaceByType("visit");
assert.ok(visit, "visit surface should exist");
assert.equal(visit!.routePattern, "/visit/:token");
assert.equal(visit!.tokenRequired, true);
assert.equal(visit!.verticals, "all");

console.log("guest-surfaces.test.ts: ok");
