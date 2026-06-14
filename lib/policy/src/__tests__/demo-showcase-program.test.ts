import assert from "node:assert/strict";
import {
  isKnownDemoShowcaseSlug,
  listDemoShowcaseBusinessSpecs,
  resolveDemoShowcaseBusinessSpec,
} from "../demo-showcase-program";

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

assert.equal(isKnownDemoShowcaseSlug("atelier-decor-dublin"), true);
assert.equal(resolveDemoShowcaseBusinessSpec("atelier-decor-dublin")?.vertical, "event-vendors");

const specs = listDemoShowcaseBusinessSpecs();
assert.ok(specs.length >= 12);
assert.ok(specs.every((s) => s.subverticalProfileId.includes(".")));

console.log("demo-showcase-program.test.ts OK");
