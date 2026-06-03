/**
 * Load PLAN_CATALOGUE from @workspace/entitlements (policy hub) for Node scripts.
 * Uses api-server's tsx dependency — no duplicate pricing constants in scripts.
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const apiCwd = resolve(root, "artifacts/api-server");

/** @returns {{ solo: { id: string; name: string; baseEurCentsPerMonth: number }; studio: { baseEurCentsPerMonth: number } }} */
export function loadPlanCataloguePricingSnapshot() {
  const snippet = `
    import { PLAN_CATALOGUE } from "../../lib/entitlements/src/index.ts";
    const { solo, studio } = PLAN_CATALOGUE;
    console.log(JSON.stringify({
      solo: { id: solo.id, name: solo.name, baseEurCentsPerMonth: solo.baseEurCentsPerMonth },
      studio: { baseEurCentsPerMonth: studio.baseEurCentsPerMonth },
    }));
  `;

  const r = spawnSync(process.execPath, ["--import", "tsx/esm", "-e", snippet], {
    cwd: apiCwd,
    encoding: "utf8",
    shell: false,
  });

  if (r.status !== 0) {
    throw new Error(r.stderr?.trim() || `PLAN_CATALOGUE load failed (exit ${r.status ?? 1})`);
  }

  const line = r.stdout.trim().split("\n").pop();
  return JSON.parse(line);
}
