/**
 * Capture G2 product-thread wedge crops for all booking-first verticals.
 *
 *   pnpm capture:vertical-wedge-beats
 *
 * Requires dashboard :5173 + API :3000.
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync(
  "pnpm",
  [
    "--filter",
    "@workspace/e2e",
    "exec",
    "playwright",
    "test",
    "capture-vertical-wedge-beats.spec.ts",
    "--project=asset-capture",
    "--workers=1",
  ],
  { cwd: resolve(root, "e2e"), stdio: "inherit", shell: true },
);
process.exit(r.status ?? 1);
