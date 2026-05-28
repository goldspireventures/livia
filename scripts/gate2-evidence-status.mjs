#!/usr/bin/env node
/**
 * Gate 2 evidence status — in-repo checks only (founder fills partner table).
 * Run: node scripts/gate2-evidence-status.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const auditPath = join(root, "docs/audits/marketing-vs-reality.md");
const audit = readFileSync(auditPath, "utf8");

const g2Blockers = [...audit.matchAll(/\|\s*\d+b?\s*\|[^|]*\|\s*build-before-G2/gi)];
const g2Open = g2Blockers.filter((m) => !/✅|Resolved/i.test(m[0]));

console.log("Gate 2 in-repo evidence status\n");
console.log("marketing-vs-reality.md");
console.log(`  build-before-G2 rows (raw matches): ${g2Blockers.length}`);
console.log(`  likely open: ${g2Open.length}`);
if (g2Open.length) {
  console.log("  → Review rows 3, 5b in docs/audits/marketing-vs-reality.md (prod cron + disclosure QA)");
}

console.log("\nAutomated checks (run locally):");
console.log("  pnpm typecheck");
console.log("  pnpm --filter @workspace/api-server test");
console.log("  pnpm test:e2e:preflight   # with stack up + founder auth");

console.log("\nFounder-only (see docs/company/FOUNDER-BACKLOG.md):");
console.log("  10 shops real bookings · 7d zero P0 · TestFlight · Inngest prod · Resend prod");

if (g2Open.length > 0) {
  console.log("\n⚠ Some build-before-G2 references remain in the audit doc — confirm prod evidence before declare.");
}
process.exit(0);
