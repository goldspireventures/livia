import assert from "node:assert/strict";
import { businessVerticalSchema } from "../types";
import {
  runPropagationClearance,
  compileVerticalManifest,
  compileAllVerticalManifests,
  validateCapabilityRouting,
  validateSurfaceConsumers,
  propagationImpactForModule,
  surfacesConsumingCapability,
} from "../propagation";

const clearance = runPropagationClearance();
assert.equal(
  clearance.ok,
  true,
  `propagation clearance failed:\n${clearance.errors.join("\n")}\nChecked: ${clearance.checked.join(", ")}`,
);

const all = compileAllVerticalManifests();
assert.equal(Object.keys(all).length, businessVerticalSchema.options.length);

for (const vertical of businessVerticalSchema.options) {
  const m = compileVerticalManifest(vertical);
  assert.equal(m.clearance.copy.ok, true, `${vertical} copy: ${m.clearance.copy.errors.join("; ")}`);
  assert.equal(m.clearance.announcement.ok, true, `${vertical} announcement`);
  assert.ok(m.demoSlug, `${vertical} demoSlug`);
  assert.ok(m.capabilityIds.length >= 4, `${vertical} capabilities`);
}

const routing = validateCapabilityRouting();
assert.equal(routing.ok, true, routing.errors.join("\n"));

const surfaces = validateSurfaceConsumers();
assert.equal(surfaces.ok, true, surfaces.errors.join("\n"));

const ownerSurfaces = surfacesConsumingCapability("owner-today");
assert.ok(ownerSurfaces.includes("tenant.owner.dashboard"));

const impact = propagationImpactForModule("booking-experience-copy.ts");
assert.ok(impact.capabilities.includes("owner-today"));
assert.ok(impact.tests.length > 0);

console.log("propagation-program.test.ts ok");
