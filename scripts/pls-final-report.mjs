#!/usr/bin/env node
/**
 * Aggregate PLS wave manifests into a final closeout report.
 *
 *   node scripts/pls-final-report.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const runDate = process.env.PLS_RUN_DATE ?? new Date().toISOString().slice(0, 10);
const plsRoot = join(root, "artifacts", "pls");

const waves = [1, 2, 3, 4, 5];
const all = [];
const byWave = {};

for (const w of waves) {
  const legacy = join(plsRoot, runDate, "manifest.json");
  const wavePath = join(plsRoot, `wave${w}-${runDate}`, "manifest.json");
  const altLegacy = w === 1 ? legacy : null;
  const path = existsSync(wavePath) ? wavePath : altLegacy && existsSync(altLegacy) ? altLegacy : null;
  if (!path) {
    byWave[w] = { steps: 0, failures: 0, missing: true };
    continue;
  }
  try {
    const rows = JSON.parse(readFileSync(path, "utf8"));
    byWave[w] = {
      steps: rows.length,
      failures: rows.filter((r) => (r.contentHits ?? []).length > 0).length,
      missing: false,
    };
    all.push(...rows);
  } catch {
    byWave[w] = { steps: 0, failures: 0, error: true };
  }
}

const contentFailures = all.filter((r) => (r.contentHits ?? []).length > 0);
const report = {
  runDate,
  generatedAt: new Date().toISOString(),
  totalSteps: all.length,
  contentFailures: contentFailures.length,
  waves: byWave,
  failedScenarios: contentFailures.map((r) => ({
    scenarioId: r.scenarioId,
    hits: r.contentHits,
    wave: r.wave,
  })),
  status: contentFailures.length === 0 && all.length > 0 ? "pass" : contentFailures.length > 0 ? "fail" : "incomplete",
};

mkdirSync(plsRoot, { recursive: true });
const outJson = join(plsRoot, `PLS-FINAL-REPORT-${runDate}.json`);
writeFileSync(outJson, JSON.stringify(report, null, 2));
writeFileSync(join(plsRoot, runDate, "manifest-all-waves.json"), JSON.stringify(all, null, 2));

console.log(`PLS final report — ${report.totalSteps} steps, ${report.contentFailures} content failures`);
console.log(`  status: ${report.status}`);
console.log(`  → ${outJson}`);
process.exit(report.status === "fail" ? 1 : 0);
