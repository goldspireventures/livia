#!/usr/bin/env node
/**
 * Static scan for non-production / operator jargon in customer-facing dashboard + mobile.
 *
 *   node scripts/pls-content-audit.mjs
 *   node scripts/pls-content-audit.mjs --strict   # exit 1 on any hit
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FORBIDDEN_CUSTOMER_PATTERNS, scanText } from "./pls-forbidden-copy.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");

const SCAN_ROOTS = [
  "artifacts/livia-dashboard/src/pages",
  "artifacts/livia-dashboard/src/components",
  "artifacts/livia-mobile/app",
  "artifacts/livia-mobile/components",
  "artifacts/livia-marketing/src/pages",
  "artifacts/livia-marketing/src/components",
];

const SKIP_PATH_RE =
  /(?:demo-|gateway-demo|demo\.tsx|beta-signup-notice|production-surface|persona\.ts|cross-surface-urls|demo-routes|demo-guided|gateway-demo-launcher)/i;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

const findings = [];

for (const rel of SCAN_ROOTS) {
  const abs = join(root, rel);
  try {
    statSync(abs);
  } catch {
    continue;
  }
  for (const file of walk(abs)) {
    const relFile = relative(root, file);
    if (SKIP_PATH_RE.test(relFile)) continue;
    const text = readFileSync(file, "utf8");
    const hits = scanText(text);
    for (const h of hits) {
      const line = text.slice(0, text.search(h.re)).split("\n").length;
      findings.push({ file: relFile, line, ...h });
    }
  }
}

if (findings.length === 0) {
  console.log("✓ PLS content audit — no forbidden patterns in customer-facing sources");
  process.exit(0);
}

console.log(`PLS content audit — ${findings.length} hit(s):\n`);
for (const f of findings) {
  console.log(`  ${f.file}:${f.line}  [${f.id}] "${f.match}" — ${f.hint}`);
}
process.exit(strict ? 1 : 0);
