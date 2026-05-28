#!/usr/bin/env node
/**
 * Repo health audit — structure, docs pointers, common foot-guns.
 * Run: node scripts/repo-health-audit.mjs
 * Exit 0 with warnings printed; exit 1 on hard failures.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const warnings = [];
const errors = [];

function exists(p) {
  return fs.existsSync(path.join(root, p));
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.name === "node_modules" || ent.name === ".git") continue;
    if (ent.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

// Required alignment docs
for (const f of [
  "docs/LIVIA-ALIGNMENT.md",
  "docs/DOC-CANONICAL-INDEX.md",
  "docs/product/SYSTEM-REALIGNMENT-PROGRAM.md",
  "docs/product/SURFACE-COMPLETION-MATRIX.md",
]) {
  if (!exists(f)) errors.push(`Missing required doc: ${f}`);
}

// dist should not be committed under api-server
const apiDist = path.join(root, "artifacts", "api-server", "dist");
if (fs.existsSync(apiDist)) {
  const files = walk(apiDist);
  if (files.length > 0) {
    warnings.push(
      `artifacts/api-server/dist has ${files.length} files — should be gitignored build output`,
    );
  }
}

// Salon in tenant UI (informational)
const artifactFiles = walk(path.join(root, "artifacts")).filter((f) =>
  /\.(tsx?|jsx?)$/.test(f),
);
let salonHits = 0;
for (const f of artifactFiles) {
  const text = fs.readFileSync(f, "utf8");
  if (/\bsalon\b/i.test(text) && !f.includes("node_modules")) salonHits++;
}
if (salonHits > 0) {
  warnings.push(
    `Found "salon" in ${salonHits} artifact source files — run realignment Phase 2.1 copy pass`,
  );
}

// Duplicate workflow file (Windows path artifact)
const gh = path.join(root, ".github", "workflows");
if (fs.existsSync(gh)) {
  const workflows = fs.readdirSync(gh);
  const ci = workflows.filter((w) => w.toLowerCase() === "ci.yml");
  if (ci.length > 1) warnings.push(`Multiple ci.yml in .github/workflows: ${ci.join(", ")}`);
}

console.log("Livia repo health audit\n");
if (errors.length) {
  console.log("ERRORS:");
  errors.forEach((e) => console.log("  ✗", e));
}
if (warnings.length) {
  console.log("WARNINGS:");
  warnings.forEach((w) => console.log("  ⚠", w));
}
if (!errors.length && !warnings.length) console.log("  ✓ No issues detected");

process.exit(errors.length ? 1 : 0);
