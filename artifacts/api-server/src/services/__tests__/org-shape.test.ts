import assert from "node:assert/strict";
import { detectOrgConfiguration, resolveOrgShapeProfile } from "@workspace/policy";

assert.equal(
  detectOrgConfiguration({
    shopCount: 1,
    activeStaffCount: 0,
    hasAdminManager: false,
    hasSeniorWithAdmin: false,
    tier: "solo",
    structureKind: "standalone",
    hostRenterCount: 0,
    brandEntityCount: 0,
  }),
  "C2",
);

const chainProfile = resolveOrgShapeProfile({
  shopCount: 5,
  activeStaffCount: 40,
  hasAdminManager: true,
  hasSeniorWithAdmin: false,
  tier: "chain",
  structureKind: "location",
  hostRenterCount: 0,
  brandEntityCount: 0,
});
assert.equal(chainProfile.code, "C7");
assert.equal(chainProfile.supportsChainGlance, true);
assert.equal(chainProfile.founderSurface, "glance");

assert.equal(
  detectOrgConfiguration({
    shopCount: 1,
    activeStaffCount: 8,
    hasAdminManager: false,
    hasSeniorWithAdmin: false,
    tier: "chair-host",
    structureKind: "standalone",
    hostRenterCount: 6,
    brandEntityCount: 0,
  }),
  "C10",
);
