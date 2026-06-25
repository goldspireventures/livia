#!/usr/bin/env node
/**
 * Sacred path gate: sign-up founder (not demo) → onboarding → first public booking.
 * Requires local full stack (API :3000 + dashboard :5173). Does not re-provision demo world.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const align = spawnSync("node", ["scripts/ensure-clerk-keys-aligned.mjs"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});
if (align.status !== 0) process.exit(align.status ?? 1);

const run = spawnSync(
  "pnpm",
  [
    "--filter",
    "@workspace/e2e",
    "exec",
    "playwright",
    "test",
    "--project=sacred-path-signup",
  ],
  { cwd: root, stdio: "inherit", shell: true },
);

process.exit(run.status ?? 1);
