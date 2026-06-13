import assert from "node:assert/strict";
import { listDemoTenantRosterRoles } from "../demo-roster-policy";

assert.deepEqual(listDemoTenantRosterRoles({ tier: "solo" }), ["owner"]);
assert.deepEqual(listDemoTenantRosterRoles({ tier: null }), ["owner"]);
assert.deepEqual(listDemoTenantRosterRoles({ tier: "studio" }), [
  "owner",
  "manager",
  "desk",
  "staff",
]);
assert.deepEqual(listDemoTenantRosterRoles({ tier: "chain" }), [
  "owner",
  "manager",
  "desk",
  "staff",
]);

console.log("demo-roster-policy.test.ts OK");
