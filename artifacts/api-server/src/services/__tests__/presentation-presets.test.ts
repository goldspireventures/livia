import assert from "node:assert/strict";
import {
  isValidPresentationPreset,
  listPresentationPresets,
  presentationPresetsEnabled,
  resolvePresentationPreset,
} from "@workspace/policy";

const verticals = [
  "hair",
  "beauty",
  "body-art",
  "wellness",
  "fitness",
  "medspa",
  "allied-health",
  "pet-grooming",
  "automotive-detailing",
] as const;

for (const vertical of verticals) {
  const presets = listPresentationPresets(vertical);
  assert.equal(presets.length, 3, `${vertical} should have 3 presets`);
  assert.equal(
    presets.filter((p) => p.isDefault).length,
    1,
    `${vertical} should have one default`,
  );
}

assert.equal(resolvePresentationPreset("body-art", null).id, "body-art-studio-dark");
assert.equal(resolvePresentationPreset("body-art", null).tokens.layout, "pipeline");
assert.equal(resolvePresentationPreset("hair", "not-a-real-preset").id, "hair-warm-chair");

assert.equal(isValidPresentationPreset("hair", "hair-barber-bold"), true);
assert.equal(isValidPresentationPreset("hair", "body-art-studio-dark"), false);

assert.equal(presentationPresetsEnabled({ LIVIA_ENV: "staging" }), true);
assert.equal(presentationPresetsEnabled({ LIVIA_PRESENTATION_PRESETS: "true" }), true);
assert.equal(presentationPresetsEnabled({ NODE_ENV: "production" }), false);

console.log("presentation-presets.test.ts OK");
