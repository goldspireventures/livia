/**
 * Capture real /b mobile crop for G2 beauty wedge (platform-default preview).
 *
 *   pnpm capture:platform-default-book
 *
 * Requires dashboard :5173 + API :3000 (vite proxies /api).
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
    "capture-platform-default-wedge-book.spec.ts",
    "--project=asset-capture",
    "--workers=1",
  ],
  { cwd: resolve(root, "e2e"), stdio: "inherit", shell: true },
);
process.exit(r.status ?? 1);
