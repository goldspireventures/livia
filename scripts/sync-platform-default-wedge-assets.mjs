/**
 * Copy locked design targets into G2 beauty wedge runtime crops.
 *
 *   pnpm sync:platform-default-wedge
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "artifacts/livia-dashboard/public/w2-gateway/platform-default");

const pairs = [
  [
    "docs/design/assets/w4-tenant/platform-default/web/inbox-thread.target.png",
    "inbox.png",
  ],
  [
    "docs/design/assets/w4-tenant/platform-default/web/owner-dashboard.target.png",
    "today.png",
  ],
  [
    "docs/design/assets/w5-public/platform-default/mobile/book-mobile.target.png",
    "book-mobile.png",
  ],
];

mkdirSync(outDir, { recursive: true });
for (const [srcRel, destName] of pairs) {
  const src = resolve(root, srcRel);
  const dest = resolve(outDir, destName);
  copyFileSync(src, dest);
  console.log(`${srcRel} → public/w2-gateway/platform-default/${destName}`);
}
