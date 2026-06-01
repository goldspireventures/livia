import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { businessVerticalSchema } from "../types";
import { defineVerticalPack } from "../vertical-pack-factory";
import { VERTICAL_PACKS } from "../verticals";
import { listPresentationPresets, PLATFORM_DEFAULT_PRESET_ID } from "../presentation-presets";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const fixturePath = resolve(root, "e2e/fixtures/vertical-shops.ts");
const seedPath = resolve(
  root,
  "artifacts/api-server/src/services/demo-vertical-shops.seed.ts",
);

for (const vertical of businessVerticalSchema.options) {
  assert.ok(VERTICAL_PACKS[vertical], `VERTICAL_PACKS missing ${vertical}`);
  assert.equal(
    VERTICAL_PACKS[vertical],
    defineVerticalPack(VERTICAL_PACKS[vertical]),
    `${vertical} pack must pass defineVerticalPack`,
  );
  const presets = listPresentationPresets(vertical);
  const expected = vertical === "beauty" ? 5 : 4;
  assert.equal(
    presets.length,
    expected,
    `${vertical} must have ${expected} presentation presets (platform-default + natives)`,
  );
  assert.ok(
    presets.some((p) => p.id === PLATFORM_DEFAULT_PRESET_ID),
    `${vertical} missing platform-default preset`,
  );
  assert.equal(presets.filter((p) => p.isDefault).length, 1, `${vertical} needs one default preset`);
}

const fixture = readFileSync(fixturePath, "utf8");
const seed = readFileSync(seedPath, "utf8");
const slugRe = /slug:\s*"([^"]+)"/g;
const fixtureSlugs = [...fixture.matchAll(slugRe)].map((m) => m[1]);
const seedSlugs = [...seed.matchAll(slugRe)].map((m) => m[1]);

for (const slug of fixtureSlugs) {
  assert.ok(seedSlugs.includes(slug), `demo-vertical-shops.seed missing slug ${slug} from e2e fixture`);
}

console.log("vertical-registry.test.ts: ok");
