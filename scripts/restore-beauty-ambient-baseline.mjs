#!/usr/bin/env node
/**
 * Restore beauty presentation CSS to the frozen 2026-06-02 baseline (founder-approved look).
 * Usage: pnpm beauty:ambient:baseline
 */
import { copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const snapshot = join(
  root,
  "artifacts/livia-dashboard/src/styles/beauty-presentation.snapshot-2026-06-02.css",
);
const target = join(root, "artifacts/livia-dashboard/src/styles/beauty-presentation.css");

copyFileSync(snapshot, target);
console.log("\n✓ Restored beauty-presentation.css from snapshot-2026-06-02");
console.log("  Hard refresh the dashboard. For runtime-only revert (no file change):");
console.log("  localStorage.setItem('livia.beautyAmbient','baseline'); location.reload();\n");
