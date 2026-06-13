import assert from "node:assert/strict";
import {
  isConsultFirstVertical,
  showOwnerConsultPipelinePanel,
  showOwnerGuestRelationshipPanel,
  showGuestVaultOwnerCallout,
} from "../client-profile-policy";

assert.equal(isConsultFirstVertical("event-vendors"), true);
assert.equal(isConsultFirstVertical("hair"), false);
assert.equal(showOwnerGuestRelationshipPanel("event-vendors"), false);
assert.equal(showOwnerConsultPipelinePanel("event-vendors"), true);
assert.equal(showGuestVaultOwnerCallout("event-vendors"), false);
assert.equal(showGuestVaultOwnerCallout("hair"), true);

console.log("client-profile-policy.test.ts OK");
