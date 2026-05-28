#!/usr/bin/env node
/**
 * Vertical onboarding kit — validate packs, coverage, playbooks, and demo slugs align.
 * Run: node scripts/vertical-onboarding-kit.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

const verticals = read("lib/policy/src/verticals.ts");
const coverage = read("lib/policy/src/vertical-coverage.ts");
const playbooks = read("lib/policy/src/vertical-playbooks.ts");
const demoShops = read("artifacts/api-server/src/services/demo-vertical-shops.seed.ts");

const verticalKeys = [...verticals.matchAll(/vertical: "([^"]+)"/g)].map((m) => m[1]);
const playbookKeys = [...playbooks.matchAll(/^\s+(\w+|"[\w-]+"):\s*\{/gm)]
  .map((m) => m[1].replace(/"/g, ""))
  .filter((k) => !["vertical", "wedge", "heroSteps", "homeModules", "publicCta"].includes(k));

const uniqueVerticals = [...new Set(verticalKeys.filter((k) => k.length < 30))];

let ok = true;
console.log("\n══ Vertical onboarding kit ══\n");

for (const v of uniqueVerticals) {
  const hasPack = verticals.includes(`${v}:`) || verticals.includes(`"${v}"`);
  const hasPlaybook = playbooks.includes(`${v}:`);
  const inCoverage = coverage.includes(`codeVertical: "${v}"`) || coverage.includes(`nearestPack: "${v}"`);
  const hasDemo = demoShops.includes(`vertical: "${v}"`) || demoShops.includes(`'${v}'`);

  const status = hasPack && hasPlaybook ? "✓" : "✗";
  if (!hasPack || !hasPlaybook) ok = false;
  console.log(
    `${status} ${v.padEnd(22)} pack=${hasPack ? "y" : "n"} playbook=${hasPlaybook ? "y" : "n"} coverage=${inCoverage ? "y" : "n"} demo=${hasDemo ? "y" : "n"}`,
  );
}

console.log(`\nTotal vertical packs: ${uniqueVerticals.length}`);
console.log(ok ? "\n✅ Kit validation passed\n" : "\n❌ Fix missing playbooks/packs\n");
process.exit(ok ? 0 : 1);
