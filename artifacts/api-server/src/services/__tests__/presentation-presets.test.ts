import assert from "node:assert/strict";
import {
  isValidPresentationPreset,
  listPresentationPresets,
  PLATFORM_DEFAULT_PRESET_ID,
  presetPreservesVerticalGates,
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
  assert.equal(presets.length, 4, `${vertical} should have 4 presets`);
  assert.equal(
    presets.filter((p) => p.isDefault).length,
    1,
    `${vertical} should have one vertical-native default`,
  );
  assert.equal(presets[0]!.id, PLATFORM_DEFAULT_PRESET_ID, `${vertical} lists platform default first`);
}

assert.equal(resolvePresentationPreset("body-art", PLATFORM_DEFAULT_PRESET_ID).cssPreset, "platform-default");
assert.equal(resolvePresentationPreset("body-art", PLATFORM_DEFAULT_PRESET_ID).tokens.shell, "aurora");

assert.equal(resolvePresentationPreset("body-art", null).id, "body-art-studio-dark");
assert.equal(resolvePresentationPreset("body-art", null).tokens.layout, "pipeline");
assert.equal(resolvePresentationPreset("hair", "not-a-real-preset").id, "hair-warm-chair");

assert.equal(isValidPresentationPreset("hair", "hair-barber-bold"), true);
assert.equal(isValidPresentationPreset("hair", "body-art-studio-dark"), false);

for (const vertical of verticals) {
  for (const preset of listPresentationPresets(vertical)) {
    assert.equal(
      presetPreservesVerticalGates(vertical, preset.id),
      true,
      `${vertical}/${preset.id} must preserve vertical gates`,
    );
  }
}

assert.equal(presentationPresetsEnabled({ LIVIA_ENV: "staging" }), true);
assert.equal(presentationPresetsEnabled({ LIVIA_DEPLOY_ENV: "staging", NODE_ENV: "production" }), true);
assert.equal(presentationPresetsEnabled({ LIVIA_PRESENTATION_PRESETS: "true" }), true);
assert.equal(presentationPresetsEnabled({ NODE_ENV: "development" }), true);
assert.equal(presentationPresetsEnabled({ NODE_ENV: "production" }), false);

console.log("presentation-presets.test.ts OK");
