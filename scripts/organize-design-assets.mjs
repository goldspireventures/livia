#!/usr/bin/env node
/**
 * One-time / idempotent layout for docs/design/assets.
 * Run: node scripts/organize-design-assets.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "docs/design/assets");

const dirs = [
  "w2-gateway/demo",
  "w2-gateway/sign-in",
  "w3-internal/support",
  "w3-internal/exec",
  "w4-tenant/beauty/presets/soft-studio",
  "w4-tenant/beauty/presets/editorial",
  "w4-tenant/beauty/presets/premium-dark",
  "w4-tenant/beauty/presets/_candidates",
  "w5-public/beauty",
  "evolution/northstar",
  "evolution/now",
  "evolution/v3",
  "captures/screen-cards",
  "explorations/platform-surfaces",
  "explorations/brand-logos",
];

for (const d of dirs) {
  mkdirSync(join(assets, d), { recursive: true });
}

function copyIf(src, dest) {
  if (!existsSync(src)) return false;
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  return true;
}

// W2 demo anchors (from evolution northstar)
copyIf(
  join(assets, "livia-evolution/northstar/g1-wedge-web.png"),
  join(assets, "w2-gateway/demo/g1-wedge-web.target.png"),
);
copyIf(
  join(assets, "livia-evolution/northstar/g1-wedge-mobile.png"),
  join(assets, "w2-gateway/demo/g1-wedge-mobile.target.png"),
);

// Mirror evolution tiers into evolution/ (canonical copy)
for (const tier of ["northstar", "now", "v3"]) {
  const srcDir = join(assets, "livia-evolution", tier);
  const destDir = join(assets, "evolution", tier);
  if (!existsSync(srcDir)) continue;
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith(".png"))) {
    copyIf(join(srcDir, f), join(destDir, f));
  }
}

// Cursor-generated dark skin candidates → repo
const cursorAssets = join(root, ".cursor/projects/c-Users-eamon-Personal-Projects-apps-Livia/assets");
const altCursor = join(dirname(root), ".cursor/projects/c-Users-eamon-Personal-Projects-apps-Livia/assets");
const candidateSources = [
  join(cursorAssets, "w4-beauty-noir-dusk-dashboard-owner-solo.sample.png"),
  join(cursorAssets, "w4-beauty-midnight-champagne-dashboard-owner-solo.sample.png"),
  join(cursorAssets, "w4-beauty-aurora-glass-dashboard-owner-solo.sample.png"),
  join(altCursor, "w4-beauty-noir-dusk-dashboard-owner-solo.sample.png"),
  join(altCursor, "w4-beauty-midnight-champagne-dashboard-owner-solo.sample.png"),
  join(altCursor, "w4-beauty-aurora-glass-dashboard-owner-solo.sample.png"),
];

const destCandidates = join(assets, "w4-tenant/beauty/presets/_candidates");
for (const src of candidateSources) {
  if (!existsSync(src)) continue;
  const name = src.split(/[/\\]/).pop();
  copyIf(src, join(destCandidates, name));
}

// README pointer for legacy folders
const legacyNote = join(assets, "livia-evolution", "README.md");
if (existsSync(legacyNote)) {
  const body = readFileSync(legacyNote, "utf8");
  if (!body.includes("../evolution/")) {
    writeFileSync(
      legacyNote,
      body +
        "\n\n> **Canonical mirror:** ../evolution/ — prefer new paths in ../README.md.\n",
    );
  }
}

console.log("✅ design assets layout updated");
console.log("   See docs/design/assets/README.md");
