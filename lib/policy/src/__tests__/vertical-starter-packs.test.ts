import assert from "node:assert/strict";
import { isConsultFirstVertical } from "../client-profile-policy";
import { businessVerticalSchema } from "../types";
import {
  getVerticalStarterPackOffer,
  getVerticalStarterPackServices,
  getVerticalStarterPackServicesForProfile,
  verticalStarterPackIncludesRetail,
} from "../vertical-starter-packs";

for (const vertical of businessVerticalSchema.options) {
  const services = getVerticalStarterPackServices(vertical);
  assert.ok(services.length >= 4, `${vertical} starter pack needs at least 4 services`);
  for (const svc of services) {
    assert.ok(svc.name.trim().length > 0, `${vertical} service name required`);
    if (isConsultFirstVertical(vertical)) {
      assert.ok(svc.durationMinutes >= 0, `${vertical} ${svc.name} duration`);
    } else {
      assert.ok(svc.durationMinutes > 0, `${vertical} ${svc.name} duration`);
    }
    assert.ok(svc.priceMinor >= 0, `${vertical} ${svc.name} price`);
  }

  const offer = getVerticalStarterPackOffer(vertical);
  assert.equal(offer.serviceCount, services.length, `${vertical} offer count`);
  assert.ok(offer.label.length > 8, `${vertical} offer label`);
  assert.ok(offer.description.length > 16, `${vertical} offer description`);
}

assert.equal(verticalStarterPackIncludesRetail("beauty"), true);
assert.equal(verticalStarterPackIncludesRetail("hair"), true);
assert.equal(verticalStarterPackIncludesRetail("wellness"), true);
assert.equal(verticalStarterPackIncludesRetail("event-vendors"), false);

const lashMenu = getVerticalStarterPackServicesForProfile("beauty", "beauty.lash");
assert.ok(lashMenu.every((s) => s.category === "Lashes"), "lash profile filters to Lashes");
assert.ok(lashMenu.length >= 3, "lash profile keeps enough services");

const barberMenu = getVerticalStarterPackServicesForProfile("hair", "hair.barber");
assert.ok(barberMenu.every((s) => s.category === "Grooming"), "barber profile filters to Grooming");

console.log("vertical-starter-packs.test.ts: ok");
