#!/usr/bin/env node
/**
 * Emits docs/product/SCREEN-INVENTORY.md from mobile routes + OpenAPI path list.
 * Run from repo root: node scripts/generate-screen-inventory.mjs
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function walkRoutes(dir, base = "") {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const rel = join(base, name.name);
    const full = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules" || name.name.startsWith(".")) continue;
      out.push(...walkRoutes(full, rel));
    } else if (name.name.endsWith(".tsx") && !name.name.startsWith("_")) {
      out.push(`app/${rel.replace(/\\/g, "/")}`);
    }
  }
  return out;
}

/** Minimal OpenAPI path extraction (no YAML parser dependency). */
function extractOpenApiPaths(yamlText) {
  const lines = yamlText.split(/\r?\n/);
  let i = lines.findIndex((l) => /^paths:\s*$/.test(l));
  if (i < 0) return [];
  const paths = [];
  for (i += 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^[a-zA-Z]/.test(line)) break;
    const m = line.match(/^\s{2}(\/[^:\s]+):\s*$/);
    if (m) paths.push(m[1]);
  }
  return [...new Set(paths)].sort();
}

const mobileApp = join(root, "artifacts", "livia-mobile", "app");
const screens = walkRoutes(mobileApp).sort();

let openapiPaths = [];
const specPath = join(root, "lib", "api-spec", "openapi.yaml");
if (existsSync(specPath)) {
  openapiPaths = extractOpenApiPaths(readFileSync(specPath, "utf8"));
}

const today = new Date().toISOString().slice(0, 10);
const md = `# Screen inventory (generated)

**Generated:** ${today}  
**Do not hand-edit** — run \`node scripts/generate-screen-inventory.mjs\` from the repo root.

## Mobile (Expo Router) — \`artifacts/livia-mobile/app\`

| Route file |
|------------|
${screens.map((s) => `| \`${s}\` |`).join("\n")}

## API — paths from \`lib/api-spec/openapi.yaml\`

_Count: ${openapiPaths.length}_

| Path |
|------|
${openapiPaths.map((p) => `| \`${p}\` |`).join("\n")}

## Notes

- Dashboard and internal web surfaces are not yet included in this generator; extend the script when those route trees should be tracked the same way.
- Map screens to OpenAPI operations in Linear or a design doc — this file is an index only.

`;

const outPath = join(root, "docs", "product", "SCREEN-INVENTORY.md");
writeFileSync(outPath, md, "utf8");
console.log(`Wrote ${outPath} (${screens.length} mobile files, ${openapiPaths.length} API paths).`);
