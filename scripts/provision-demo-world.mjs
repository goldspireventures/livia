/**
 * Provision the full demo world (Clerk personas + 18+ businesses + live day + Liv signals).
 *
 * Usage (API must be running on PORT 3001):
 *   node --env-file=.env scripts/provision-demo-world.mjs
 *
 * Or after building api-server:
 *   pnpm demo:provision
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const apiBase = (process.env.E2E_API_BASE ?? "http://127.0.0.1:3001").replace(/\/$/, "");

async function main() {
  console.log(`\n▶ Provisioning demo world via ${apiBase}/api/demo/provision\n`);

  let res;
  try {
    res = await fetch(`${apiBase}/api/demo/provision`, { method: "POST" });
  } catch (err) {
    console.error("✗ Could not reach API. Start: pnpm dev:api");
    console.error(err);
    process.exit(1);
  }

  const text = await res.text();
  if (!res.ok) {
    console.error(`✗ Provision failed (${res.status}): ${text.slice(0, 500)}`);
    process.exit(1);
  }

  const body = JSON.parse(text);
  console.log(`✓ Provisioned ${body.businesses?.length ?? 0} businesses`);
  for (const b of body.businesses ?? []) {
    console.log(`  · ${b.slug}`);
  }
  console.log(`✓ Personas: ${(body.personas ?? []).map((p) => p.id).join(", ")}`);
  console.log("\nOpen http://localhost:5173/demo → pick a persona door.\n");
}

main();
