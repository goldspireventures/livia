#!/usr/bin/env node
/**
 * Report screen-card YAML specs vs PNG baselines.
 *
 *   pnpm screen-cards:status
 */
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const yamlDir = join(root, "docs/design/screen-cards");
const pngDir = join(root, "docs/design/assets/screen-cards");

const yamlIds = readdirSync(yamlDir)
  .filter((f) => f.endsWith(".yaml"))
  .map((f) => f.replace(/\.yaml$/, ""))
  .sort();

const pngIds = readdirSync(pngDir)
  .filter((f) => f.endsWith(".png"))
  .map((f) => f.replace(/\.png$/, ""))
  .sort();

const pngSet = new Set(pngIds);
const yamlSet = new Set(yamlIds);

const missingPng = yamlIds.filter((id) => !pngSet.has(id));
const orphanPng = pngIds.filter((id) => !yamlSet.has(id));

console.log("\n══ Screen cards status ══\n");
console.log(`YAML specs:    ${yamlIds.length}`);
console.log(`PNG baselines: ${pngIds.length}`);
console.log(`With both:     ${yamlIds.filter((id) => pngSet.has(id)).length}`);
console.log(`YAML only:     ${missingPng.length} (need capture)`);
console.log(`PNG only:      ${orphanPng.length}\n`);

if (missingPng.length) {
  console.log("Missing PNG (add via pnpm screen-cards:update):");
  for (const id of missingPng) console.log(`  ${id}`);
  console.log("");
}

if (orphanPng.length) {
  console.log("PNG without YAML spec:");
  for (const id of orphanPng) console.log(`  ${id}`);
  console.log("");
}

console.log("Registry: lib/policy/src/northstar-p0-registry.ts (SCREEN_CARD_P0)");
console.log("E2E:      pnpm --filter @workspace/e2e run test:screen-card-p0");
console.log("Update:   pnpm screen-cards:update\n");
