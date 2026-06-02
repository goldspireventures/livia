#!/usr/bin/env node
/**
 * R3-E8 — v3 evolution tier assets present for all gallery screens.
 *
 *   pnpm evolution:v3-check
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Keep in sync with artifacts/livia-dashboard/src/lib/livia-evolution-screens.ts */
const EVOLUTION_IMAGE_FILES = [
  "m4-marketing-home-web.png",
  "g1-wedge-web.png",
  "g1-wedge-mobile.png",
  "tenant-inbox-web.png",
  "tenant-inbox-mobile.png",
  "tenant-today-mobile.png",
  "tenant-proofs-web.png",
  "guest-proof-mobile.png",
  "public-book-mobile.png",
  "i4-thread-web.png",
  "i2-shiplane-web.png",
];

const publicV3 = join(root, "artifacts/livia-dashboard/public/livia-evolution/v3");
const docsV3 = join(root, "docs/design/assets/livia-evolution/v3");

console.log("\n══ Evolution v3 tier check (R3-E8) ══\n");

let ok = true;
for (const file of EVOLUTION_IMAGE_FILES) {
  const inPublic = existsSync(join(publicV3, file));
  const inDocs = existsSync(join(docsV3, file));
  const pass = inPublic && inDocs;
  console.log(`${pass ? "✓" : "✗"} ${file} (public=${inPublic}, docs=${inDocs})`);
  ok = pass && ok;
}

console.log(ok ? "\n✅ evolution v3 tier check passed\n" : "\n❌ evolution v3 tier check failed\n");
process.exit(ok ? 0 : 1);
