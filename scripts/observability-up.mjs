/**
 * Start local Loki + Grafana (docker) for log correlation drills.
 *   node scripts/observability-up.mjs
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const compose = resolve(root, "docker/observability/docker-compose.yml");

console.log("Starting Loki (3100) + Grafana (3000)…");
// Do not use shell: true — paths with spaces (e.g. "Personal Projects") break quoting on Windows.
const r = spawnSync("docker", ["compose", "-f", compose, "up", "-d"], {
  cwd: root,
  stdio: "inherit",
  windowsHide: true,
});
if (r.status !== 0) {
  console.error("\nDocker compose failed. Ensure Docker Desktop is running, then retry:");
  console.error(`  docker compose -f "${compose}" up -d`);
  process.exit(r.status ?? 1);
}
console.log("\nGrafana: http://127.0.0.1:3000");
console.log("Set LOKI_PUSH_URL=http://127.0.0.1:3100/loki/api/v1/push when running api-server");
