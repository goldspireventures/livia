#!/usr/bin/env node
/**
 * Fail if deployable artifacts still reference legacy livia.io public URLs.
 * Demo/test emails (@livia.io) are allowed.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const scanRoot = path.join(root, "artifacts");

const FORBIDDEN = [
  /https?:\/\/app\.livia\.io\b/i,
  /https?:\/\/livia\.io\b/i,
  /https?:\/\/api\.livia\.io\b/i,
  /https?:\/\/status\.livia\.io\b/i,
];

const ALLOW_LINE = /@livia\.io/i;

const SKIP_DIRS = new Set(["node_modules", "dist", ".turbo", "coverage"]);
const EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".json",
  ".html",
  ".md",
]);

async function walk(dir, hits = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      await walk(full, hits);
      continue;
    }
    const ext = path.extname(ent.name);
    if (!EXT.has(ext)) continue;
    const rel = path.relative(root, full).replace(/\\/g, "/");
    const text = await readFile(full, "utf8");
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (ALLOW_LINE.test(line) && !/https?:\/\//i.test(line)) continue;
      for (const re of FORBIDDEN) {
        if (re.test(line)) {
          hits.push({ file: rel, line: i + 1, text: line.trim() });
          break;
        }
      }
    }
  }
  return hits;
}

const hits = await walk(scanRoot);
if (hits.length === 0) {
  console.log("OK — no legacy livia.io public URLs under artifacts/");
  process.exit(0);
}

console.error(`Found ${hits.length} legacy URL(s) in artifacts/:\n`);
for (const h of hits) {
  console.error(`  ${h.file}:${h.line}`);
  console.error(`    ${h.text}\n`);
}
console.error("Use livia-hq.com (app / api / marketing). Demo emails may stay @livia.io.");
process.exit(1);
