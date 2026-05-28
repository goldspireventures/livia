#!/usr/bin/env node
/**
 * Merge UX findings JSON + executive hat tags into a punch-list markdown.
 *   node scripts/ux-punch-list-from-findings.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = resolve(root, "e2e/visual-captures/ux-quality-findings.json");
const outPath = resolve(root, "docs/testing/UX-PUNCH-LIST.md");

const HAT = {
  error_copy: "Product + Engineering",
  axe: "Design + Engineering",
  layout: "Design",
  empty_primary: "Product",
};

let findings = [];
if (existsSync(jsonPath)) {
  findings = JSON.parse(readFileSync(jsonPath, "utf8")).findings ?? [];
}

const byRoute = new Map();
for (const f of findings) {
  if (!byRoute.has(f.route)) byRoute.set(f.route, []);
  byRoute.get(f.route).push(f);
}

const lines = [
  "# UX / visual punch list",
  "",
  `**Generated:** ${new Date().toISOString().slice(0, 10)}`,
  "**Sources:** `ux-quality-gate.spec.ts`, `e2e:full-visual-audit:web`, founder-checklist captures",
  "",
  "## Summary",
  "",
  `| Automated findings | ${findings.length} |`,
  "| Visual captures | Review `e2e/visual-captures/` |",
  "| Founder backlog | [`FOUNDER-BACKLOG.md`](../company/FOUNDER-BACKLOG.md) |",
  "",
];

if (findings.length === 0) {
  lines.push("No automated UX gate failures in the last run. **Still require human review** of screenshots for hierarchy, copy tone, and dynamic growth (long lists, empty states).", "");
} else {
  lines.push("## P0 — fix before partners", "", "| Route | Kind | Owner hat | Detail |", "|-------|------|-----------|--------|");
  for (const f of findings) {
    lines.push(`| \`${f.route}\` | ${f.kind} | ${HAT[f.kind] ?? "Eng"} | ${f.detail.replace(/\|/g, "\\|").slice(0, 100)} |`);
  }
  lines.push("");
}

lines.push(
  "## P1 — wedge polish (human review checklist)",
  "",
  "- [ ] **Owner Today:** briefing → moments → incidents order; no vertical scroll cliff",
  "- [ ] **Manager Queue:** lens counts match list; empty lens copy clear",
  "- [ ] **Inbox thread:** reply box visible without zoom; Liv assist not clipped",
  "- [ ] **Settings → Comms:** session-expired vs connected states obvious",
  "- [ ] **Public book:** service grid on mobile width; AI disclosure visible",
  "- [ ] **Error surfaces:** toast vs inline; no raw stack traces",
  "",
  "## P2 — forward-looking layout",
  "",
  "- [ ] Long booking lists: virtualise or paginate (inbox, bookings, customers)",
  "- [ ] Sticky headers on thread + floor views",
  "- [ ] `min-h-0` / flex children on split panes (inbox master-detail)",
  "",
  "## Re-run",
  "",
  "```bash",
  "pnpm dev:api & pnpm dev:dashboard &",
  "pnpm e2e:full-visual-audit:web",
  "pnpm --filter @workspace/e2e exec playwright test tests/ux-quality-gate.spec.ts",
  "node scripts/ux-punch-list-from-findings.mjs",
  "```",
  "",
);

writeFileSync(outPath, lines.join("\n"));
console.log(`Wrote ${outPath}`);
