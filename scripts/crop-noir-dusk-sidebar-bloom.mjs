/**
 * Crop the botanical flower from the northstar mock (bottom-left sidebar).
 * Source: docs/design/assets/w4-tenant/beauty/presets/noir-dusk/dashboard-owner-solo.target.png
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(
  root,
  "docs/design/assets/w4-tenant/beauty/presets/noir-dusk/dashboard-owner-solo.target.png",
);
const out = path.join(
  root,
  "artifacts/livia-dashboard/public/assets/beauty/noir-dusk-sidebar-bloom.png",
);

const { default: sharp } = await import("sharp");

// 1536×1024 mock — flower sits in sidebar lower zone (tuned to target art).
const extract = { left: 0, top: 500, width: 360, height: 524 };

await sharp(src)
  .extract(extract)
  .png({ compressionLevel: 9 })
  .toFile(out);

console.log("Wrote", out, extract);
