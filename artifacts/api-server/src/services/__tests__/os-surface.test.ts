/**
 * OS surface invariants — hiring removed from mounted API router.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const routesIndex = readFileSync(join(here, "../../routes/index.ts"), "utf8");

assert.ok(
  !routesIndex.includes("hiringRouter"),
  "hiring router must not be mounted in routes/index.ts",
);
assert.ok(
  !routesIndex.match(/from\s+["']\.\/hiring["']/),
  "hiring route module must not be imported in routes/index.ts",
);

console.log("os-surface.test.ts: ok");
