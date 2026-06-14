import assert from "node:assert/strict";
import {
  isPublicRetailVertical,
  PUBLIC_RETAIL_VERTICALS,
  buildTenantPostSessionInboxDraft,
  normalizeRetailCartItems,
  resolveTenantRetailPack,
  tenantRetailTemplatesForBusiness,
  verticalSupportsRetail,
} from "../tenant-retail-program";
import { verticalStarterPackIncludesRetail } from "../vertical-starter-packs";

assert.equal(verticalSupportsRetail("hair"), true);
assert.equal(verticalSupportsRetail("beauty"), true);
assert.equal(verticalSupportsRetail("event-vendors"), false);
assert.equal(isPublicRetailVertical("wellness"), true);
assert.equal(PUBLIC_RETAIL_VERTICALS.length, 9);

assert.ok(tenantRetailTemplatesForBusiness("hair").length >= 4);
assert.ok(tenantRetailTemplatesForBusiness("hair", "hair.barber").length >= 4);
assert.notEqual(
  tenantRetailTemplatesForBusiness("hair")[0]?.name,
  tenantRetailTemplatesForBusiness("hair", "hair.barber")[0]?.name,
);

const hairPack = resolveTenantRetailPack("hair")!;
assert.ok(hairPack.ownerTitle.length > 3);
assert.ok(buildTenantPostSessionInboxDraft("hair").body.includes("stylist"));

assert.equal(verticalStarterPackIncludesRetail("hair"), true);
assert.equal(verticalStarterPackIncludesRetail("beauty"), true);
assert.equal(verticalStarterPackIncludesRetail("event-vendors"), false);

const merged = normalizeRetailCartItems([
  { productId: "a", quantity: 2 },
  { productId: "a", quantity: 1 },
]);
assert.deepEqual(merged, [{ productId: "a", quantity: 3 }]);

console.log("tenant-retail-program.test.ts OK");
