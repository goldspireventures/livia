#!/usr/bin/env node
/**
 * Merge UX findings into VISUAL-AUDIT-LOG and delete screenshot PNGs (analysis-only retention).
 *
 *   node scripts/visual-audit-closeout.mjs
 */
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const capturesRoot = join(root, "e2e", "visual-captures");
const logPath = join(root, "docs", "testing", "VISUAL-AUDIT-LOG.md");

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function deletePngs(dir) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      n += deletePngs(p);
      try {
        if (readdirSync(p).length === 0) rmSync(p, { recursive: true });
      } catch {
        /* ignore */
      }
    } else if (ent.name.endsWith(".png")) {
      rmSync(p);
      n += 1;
    }
  }
  return n;
}

const sources = [
  join(capturesRoot, "ux-quality-findings.json"),
  join(capturesRoot, "visual-deep-findings.json"),
];

const allFindings = [];
for (const src of sources) {
  const data = readJson(src);
  if (data?.findings?.length) {
    for (const f of data.findings) {
      allFindings.push({ ...f, source: src.includes("deep") ? "deep" : "ux-gate" });
    }
  }
}

const date = new Date().toISOString().slice(0, 10);
const hard = allFindings.filter((f) => f.kind === "error_copy");
const axe = allFindings.filter((f) => f.kind === "axe");
const layout = allFindings.filter((f) => f.kind === "layout");

let section = `\n## ${date} — Automated deep analysis closeout\n\n`;
section += `| Metric | Count |\n|--------|-------|\n`;
section += `| Routes scanned (automated) | ${allFindings.length > 0 ? "see JSON" : "0"} |\n`;
section += `| Hard error copy | ${hard.length} |\n`;
section += `| Serious a11y (axe) | ${axe.length} |\n`;
section += `| Layout overflow | ${layout.length} |\n\n`;

if (hard.length > 0) {
  section += `### P0 — error copy\n\n| Route | Detail |\n|-------|--------|\n`;
  for (const f of hard.slice(0, 40)) {
    section += `| ${f.route} | ${f.detail.replace(/\|/g, "/").slice(0, 120)} |\n`;
  }
  section += "\n";
}

if (axe.length > 0) {
  section += `### P1 — a11y (axe serious+)\n\n| Route | Detail |\n|-------|--------|\n`;
  for (const f of axe.slice(0, 40)) {
    section += `| ${f.route} | ${f.detail.replace(/\|/g, "/").slice(0, 120)} |\n`;
  }
  section += "\n";
}

if (layout.length > 0) {
  section += `### P2 — layout\n\n`;
  for (const f of layout.slice(0, 20)) {
    section += `- ${f.route}: ${f.detail}\n`;
  }
  section += "\n";
}

if (allFindings.length === 0) {
  section += `**Result:** No automated findings — surfaces passed error-copy + serious axe gates.\n\n`;
}

section += `**PNG cleanup:** screenshots removed after analysis (findings JSON retained).\n`;

if (existsSync(logPath)) {
  const existing = readFileSync(logPath, "utf8");
  const marker = `## ${date} — Automated deep analysis closeout`;
  if (!existing.includes(marker)) {
    const insertAt = existing.indexOf("\n---\n", existing.indexOf("## 2026-06-21"));
    if (insertAt > 0) {
      writeFileSync(logPath, existing.slice(0, insertAt) + section + existing.slice(insertAt));
    } else {
      writeFileSync(logPath, section + "\n---\n\n" + existing);
    }
  }
} else {
  writeFileSync(logPath, `# Visual audit log\n${section}`);
}

const removed = deletePngs(capturesRoot);
console.log(`\n✓ Visual audit closeout`);
console.log(`  Findings: ${allFindings.length} (${hard.length} hard, ${axe.length} axe, ${layout.length} layout)`);
console.log(`  Removed ${removed} PNG files under e2e/visual-captures/`);
console.log(`  Log: docs/testing/VISUAL-AUDIT-LOG.md\n`);

if (hard.length > 0) process.exit(1);
