/**
 * Policy export naming — keep grep-friendly identifiers under control.
 * Baseline-grandfathers existing violations; CI fails only on NEW ones.
 *
 *   pnpm policy:name-check
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_PATH = join(ROOT, "__tests__", "export-name-lint-baseline.txt");
const MAX_EXPORT_FN_LEN = 28;
const GUARD_PARAM_MIN = 3;
const OBJECT_ARG = /^(args|input|opts|meta|ctx|config)\s*:/;

function walkTs(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      walkTs(path, out);
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      out.push(path);
    }
  }
  return out;
}

function relPath(file: string): string {
  return file.slice(ROOT.length + 1).replace(/\\/g, "/");
}

function collectViolations(): string[] {
  const lines: string[] = [];
  for (const file of walkTs(ROOT)) {
    const rel = relPath(file);
    const src = readFileSync(file, "utf8");
    for (const match of src.matchAll(/^export function (\w+)\(([^)]*)\)/gm)) {
      const name = match[1];
      const params = match[2].trim();
      if (name.length > MAX_EXPORT_FN_LEN) {
        lines.push(`long:${rel}:${name}`);
      }
      if (!params) continue;
      const paramCount = params.split(",").length;
      if (paramCount >= GUARD_PARAM_MIN && !OBJECT_ARG.test(params)) {
        lines.push(`wide:${rel}:${name}`);
      }
    }
  }
  return lines.sort();
}

const current = collectViolations();
const baseline = existsSync(BASELINE_PATH)
  ? readFileSync(BASELINE_PATH, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
  : [];

const baselineSet = new Set(baseline);
const newViolations = current.filter((line) => !baselineSet.has(line));

if (newViolations.length) {
  console.error(`\n✗ New policy export naming violations (${newViolations.length}):\n`);
  for (const line of newViolations) console.error(`  - ${line}`);
  console.error(
    `\nKeep names ≤${MAX_EXPORT_FN_LEN} chars; use meta/args objects for ${GUARD_PARAM_MIN}+ params.\n`,
  );
  process.exit(1);
}

if (!baseline.length) {
  console.warn(
    `⚠ export-name-lint baseline missing — run: pnpm policy:name-check:baseline`,
  );
}

console.log(`export-name-lint.ts OK (${current.length} grandfathered)`);
