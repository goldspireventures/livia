import assert from "node:assert/strict";
import {
  isKnownDemoShowcaseSlug,
  listDemoShowcaseBusinessSpecs,
  listDemoSubverticalRoster,
  listDemoWorldSlugs,
  resolveDemoShowcaseBusinessSpec,
} from "../demo-showcase-program";
import { listAllSubverticalProfiles } from "../subvertical-profiles";

const conors = resolveDemoShowcaseBusinessSpec("conors-cut-co");
assert.ok(conors);
assert.equal(conors.vertical, "hair");
assert.equal(conors.subverticalProfileId, "hair.barber");
assert.equal(conors.tier, "solo");

const luxe = resolveDemoShowcaseBusinessSpec("luxe-salon-spa");
assert.ok(luxe);
assert.equal(luxe.subverticalProfileId, "hair.salon");

const bloom = resolveDemoShowcaseBusinessSpec("bloom-beauty-dublin");
assert.ok(bloom);
assert.equal(bloom.subverticalProfileId, "beauty.lash");
assert.equal(bloom.tier, "studio");

assert.equal(isKnownDemoShowcaseSlug("atelier-decor-dublin"), true);
assert.equal(resolveDemoShowcaseBusinessSpec("atelier-decor-dublin")?.vertical, "event-vendors");

const roster = listDemoSubverticalRoster();
const profiles = listAllSubverticalProfiles();
assert.equal(roster.length, profiles.length, "one roster row per onboarding profile");

const profileIds = new Set(profiles.map((p) => p.id));
const rosterIds = new Set(roster.map((r) => r.subverticalProfileId));
assert.equal(rosterIds.size, roster.length, "unique profile id per roster row");
for (const id of profileIds) {
  assert.ok(rosterIds.has(id), `missing roster row for ${id}`);
}

const slugSet = new Set(roster.map((r) => r.slug));
assert.equal(slugSet.size, roster.length, "unique canonical slug per profile");

const specs = listDemoShowcaseBusinessSpecs();
assert.ok(specs.length >= roster.length);
assert.ok(specs.every((s) => s.subverticalProfileId.includes(".")));

const worldSlugs = listDemoWorldSlugs();
assert.ok(worldSlugs.length > roster.length, "scenario extras included");
for (const row of roster) {
  assert.ok(worldSlugs.includes(row.slug), `${row.slug} in demo world`);
}

console.log("demo-showcase-program.test.ts OK");
