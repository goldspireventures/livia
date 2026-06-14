import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = join(ROOT, "__tests__", "export-name-lint-baseline.txt");
const MAX = 28;
const MINP = 3;
const OBJ = /^(args|input|opts|meta|ctx|config)\s*:/;

function walk(d: string, o: string[] = []): string[] {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) {
      if (e.name !== "__tests__") walk(p, o);
    } else if (e.name.endsWith(".ts") && !e.name.endsWith(".test.ts")) {
      o.push(p);
    }
  }
  return o;
}

const lines: string[] = [];
for (const file of walk(ROOT)) {
  const rel = file.slice(ROOT.length + 1).replace(/\\/g, "/");
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/^export function (\w+)\(([^)]*)\)/gm)) {
    const name = m[1];
    const params = m[2].trim();
    if (name.length > MAX) lines.push(`long:${rel}:${name}`);
    if (params) {
      const n = params.split(",").length;
      if (n >= MINP && !OBJ.test(params)) lines.push(`wide:${rel}:${name}`);
    }
  }
}

writeFileSync(BASELINE, `${lines.sort().join("\n")}\n`, "utf8");
console.log(`Wrote ${lines.length} baseline entries`);
