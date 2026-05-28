/**
 * Persona RBAC matrix — kept in sync with dashboard/mobile settings-persona.ts
 */
import assert from "node:assert/strict";

type Persona = "founder" | "owner" | "manager" | "receptionist" | "staff";

function canEditShop(p: Persona): boolean {
  return p === "founder" || p === "owner";
}
function canEditLiv(p: Persona): boolean {
  return p === "founder" || p === "owner" || p === "manager";
}
function canViewBilling(p: Persona): boolean {
  return p === "founder" || p === "owner";
}
function canViewComms(p: Persona): boolean {
  return p !== "staff";
}

assert.equal(canEditShop("owner"), true);
assert.equal(canEditLiv("owner"), true);
assert.equal(canViewBilling("owner"), true);
assert.equal(canViewComms("owner"), true);
assert.equal(canEditShop("staff"), false);
assert.equal(canViewBilling("staff"), false);
assert.equal(canViewComms("receptionist"), true);
assert.equal(canViewBilling("receptionist"), false);

console.log("rbac-smoke.test.ts: ok");
