import assert from "node:assert/strict";
import {
  getPresentationPromotionMatrix,
  isValidPresentationPreset,
  listPresentationPresets,
  listPresentationPresetsForTenantPicker,
  PLATFORM_DEFAULT_PRESET_ID,
  presetPreservesVerticalGates,
  presentationPresetsActive,
  presentationPresetsEnabled,
  presentationPresetsProductionEnabled,
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
  const expectedLen = vertical === "beauty" ? 5 : 4;
  assert.equal(presets.length, expectedLen, `${vertical} preset count`);
  const picker = listPresentationPresetsForTenantPicker(vertical);
  assert.ok(
    !picker.some((p) => p.id === PLATFORM_DEFAULT_PRESET_ID),
    `${vertical} picker hides platform-default`,
  );
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

assert.equal(presentationPresetsProductionEnabled({ LIVIA_PRESENTATION_PRESETS: "true" }), true);
assert.equal(presentationPresetsProductionEnabled({ NODE_ENV: "production" }), false);
assert.equal(presentationPresetsActive({ NODE_ENV: "production" }), false);
assert.equal(presentationPresetsActive({ LIVIA_PRESENTATION_PRESETS: "true" }), true);
assert.equal(presentationPresetsActive({ LIVIA_ENV: "staging" }), true);

const matrix = getPresentationPromotionMatrix();
const expectedMatrixRows = verticals.reduce(
  (sum, vertical) => sum + listPresentationPresets(vertical).length,
  0,
);
assert.equal(matrix.length, expectedMatrixRows, "promotion matrix rows (9 verticals; beauty has 5 presets)");
assert.ok(matrix.every((r) => r.productionReady), "all presets production-ready when flag on");

console.log("presentation-presets.test.ts OK");
