#!/usr/bin/env node
/**
 * Fast-forward a demo tenant toward Liv learning milestones (PLS / local only).
 *
 *   node scripts/pls-simulate-usage.mjs --slug luxe-salon-spa
 *   node scripts/pls-simulate-usage.mjs --slug clarity-medspa-dublin --months 12
 */
import { readFileSync, existsSync } from "node:fs";
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

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const args = process.argv.slice(2);
const slugIdx = args.indexOf("--slug");
const slug = slugIdx >= 0 ? args[slugIdx + 1] : "luxe-salon-spa";
const monthsIdx = args.indexOf("--months");
const months = monthsIdx >= 0 ? Number(args[monthsIdx + 1]) : 12;

async function main() {
  const res = await fetch(`${apiBase}/api/dev/pls/fast-forward`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, months, triggerLearning: true }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("PLS fast-forward failed:", res.status, body);
    process.exit(1);
  }
  console.log("✓ PLS fast-forward", slug);
  console.log(JSON.stringify(body, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
