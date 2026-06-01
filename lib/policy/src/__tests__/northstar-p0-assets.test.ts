/**
 * Northstar P0 asset gate — docs + dashboard public copies in sync.
 *   node --import tsx/esm lib/policy/src/__tests__/northstar-p0-assets.test.ts
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  NORTHSTAR_DOCS_DIR,
  NORTHSTAR_PUBLIC_DIR,
  SCREEN_CARD_BASELINE_DIR,
  SCREEN_CARD_P0,
  TENANT_NORTHSTAR_P0,
} from "../northstar-p0-registry";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

const files = [...new Set(TENANT_NORTHSTAR_P0.map((e) => e.northstarFile))];

for (const file of files) {
  const docPath = resolve(root, NORTHSTAR_DOCS_DIR, file);
  const pubPath = resolve(root, NORTHSTAR_PUBLIC_DIR, file);
  assert.ok(existsSync(docPath), `missing docs northstar: ${docPath}`);
  assert.ok(existsSync(pubPath), `missing public northstar: ${pubPath}`);
  const docHash = createHash("sha256").update(readFileSync(docPath)).digest("hex");
  const pubHash = createHash("sha256").update(readFileSync(pubPath)).digest("hex");
  assert.equal(docHash, pubHash, `${file}: docs and public northstar out of sync`);
  const stat = readFileSync(docPath);
  assert.ok(stat.length > 8_000, `${file}: northstar PNG too small`);
}

for (const entry of SCREEN_CARD_P0) {
  const cardPath = resolve(root, SCREEN_CARD_BASELINE_DIR, entry.northstarFile);
  assert.ok(existsSync(cardPath), `missing screen-card baseline: ${cardPath}`);
  assert.ok(readFileSync(cardPath).length > 8_000, `${entry.northstarFile}: screen-card PNG too small`);
}

assert.ok(TENANT_NORTHSTAR_P0.length >= 4, "tenant northstar P0 registry populated");
assert.ok(SCREEN_CARD_P0.length >= 12, "screen-card P0 registry populated");
