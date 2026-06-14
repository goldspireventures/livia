import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PRESENTATION_PRESETS } from "../presentation-presets";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const themePath = join(repoRoot, "artifacts/livia-dashboard/src/lib/experience-theme.ts");
const presetCssPath = join(repoRoot, "artifacts/livia-dashboard/src/styles/preset-guest-surfaces.css");
const themeSrc = readFileSync(themePath, "utf8");
const presetCss = readFileSync(presetCssPath, "utf8");

const cssPresets = new Set<string>();
for (const presets of Object.values(PRESENTATION_PRESETS)) {
  for (const p of presets) {
    if (p.cssPreset !== "platform-default") {
      cssPresets.add(p.cssPreset);
    }
  }
}

for (const cssPreset of cssPresets) {
  const keyPattern =
    cssPreset.includes("-")
      ? `"${cssPreset.replace(/-/g, "\\-")}"\\s*:`
      : `(?:${cssPreset}|"${cssPreset}")\\s*:`;
  assert.match(
    themeSrc,
    new RegExp(keyPattern),
    `experience-theme missing token override for ${cssPreset}`,
  );
}

/** Body-art + shared guest flows must have preset-specific surface rules. */
for (const bodyArt of ["studio-dark", "flash-light", "minimal-mono"] as const) {
  assert.match(
    presetCss,
    new RegExp(`data-presentation="${bodyArt}"`),
    `preset-guest-surfaces.css missing body-art rules for ${bodyArt}`,
  );
}

console.log("preset-surface-coverage.test.ts OK");
