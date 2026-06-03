/**
 * Copy Bloom beauty wedge screenshots into G2 runtime crops.
 *
 *   pnpm sync:platform-default-wedge
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = resolve(root, "docs/design/assets/w2-gateway/beauty/bloom-wedge");
const outDir = resolve(root, "artifacts/livia-dashboard/public/w2-gateway/platform-default");

const pairs = [
  ["bookings.png", "inbox.png"],
  ["public-book-mobile.png", "book-mobile.png"],
  ["today.png", "today.png"],
];

mkdirSync(outDir, { recursive: true });
for (const [srcName, destName] of pairs) {
  const src = resolve(srcDir, srcName);
  const dest = resolve(outDir, destName);
  copyFileSync(src, dest);
  console.log(`bloom-wedge/${srcName} → public/w2-gateway/platform-default/${destName}`);
}
