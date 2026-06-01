#!/usr/bin/env node
/**
 * Copy founder-approved beauty target PNGs into docs/design/assets/w4-tenant/beauty/presets/
 * Run: node scripts/organize-beauty-target-visuals.mjs
 */
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const home = process.env.USERPROFILE ?? process.env.HOME ?? "";
const cursorAssets = join(
  home,
  ".cursor/projects/c-Users-eamon-Personal-Projects-apps-Livia/assets",
);
const beautyW4 = join(root, "docs/design/assets/w4-tenant/beauty/presets");
const beautyW5 = join(root, "docs/design/assets/w5-public/beauty/presets");

const SOURCES = [cursorAssets, join(beautyW4, "_candidates")];

/** User-attached exports (long filenames under cursor assets). */
const ATTACHED_PREFIX =
  "c__Users_eamon_AppData_Roaming_Cursor_User_workspaceStorage_d0040fe83c64d6c595c840afa17aa615_images_";

function findSource(name) {
  for (const dir of SOURCES) {
    const p = join(dir, name);
    if (existsSync(p)) return p;
  }
  return null;
}

function install(worldDir, preset, srcName, destName) {
  const src = findSource(srcName);
  if (!src) {
    console.warn(`  skip ${worldDir}/${preset}/${destName} — missing ${srcName}`);
    return;
  }
  const destDir = join(worldDir, preset);
  mkdirSync(destDir, { recursive: true });
  copyFileSync(src, join(destDir, destName));
  console.log(`  ✓ ${worldDir.replace(/.*assets[\\/]/, "")}/${preset}/${destName}`);
}

const W4_MAP = [
  ["noir-dusk", "w4-beauty-noir-dusk-dashboard-owner-solo.sample.png", "dashboard-owner-solo.target.png"],
  ["soft-studio", `${ATTACHED_PREFIX}Generated_imagec-52ed3349-e872-450f-96ac-f93451fdab04.png`, "dashboard-owner-solo.target.png"],
  ["soft-studio", "skin-soft-studio-solo-dashboard.png", "dashboard-owner-solo.target.png"],
  ["soft-studio", `${ATTACHED_PREFIX}Generated_imagev-81f02385-095b-4999-8eaa-7c5b9a880304.png`, "dashboard-manager.target.png"],
  ["soft-studio", "skin-soft-studio-manager-dashboard.png", "dashboard-manager.target.png"],
  ["editorial", `${ATTACHED_PREFIX}Generated_imagel-9c342f06-00b4-454e-93b4-d664f6a6b078.png`, "dashboard-owner-solo.target.png"],
  ["editorial", "skin-editorial-solo-dashboard.png", "dashboard-owner-solo.target.png"],
  ["editorial", `${ATTACHED_PREFIX}Generated_imagek-10c27e6d-3898-4f2b-aaae-23b4ddfdc398.png`, "dashboard-manager.target.png"],
  ["editorial", "skin-editorial-manager-dashboard.png", "dashboard-manager.target.png"],
  ["premium-dark", `${ATTACHED_PREFIX}Generated_image-2c7a85db-ee9c-4a74-8eae-29c87f78dcf9.png`, "dashboard-owner-solo.target.png"],
  ["premium-dark", "livia-dashboard-solo-beauty-nails.png", "dashboard-owner-solo.target.png"],
  ["premium-dark", `${ATTACHED_PREFIX}Generated_image--42617732-5700-4408-9147-43e883ec03ff.png`, "dashboard-manager.target.png"],
  ["premium-dark", "livia-dashboard-manager-beauty-nails.png", "dashboard-manager.target.png"],
  ["noir-dusk", "settings-appearance-owner.target.png", "settings-appearance-owner.target.png"],
  ["soft-studio", "settings-appearance-owner-soft-studio.target.png", "settings-appearance-owner.target.png"],
  ["editorial", "settings-appearance-owner-editorial.target.png", "settings-appearance-owner.target.png"],
  ["premium-dark", "settings-appearance-owner-premium-dark.target.png", "settings-appearance-owner.target.png"],
];

const W5_MAP = [
  ["noir-dusk", "w5-beauty-noir-dusk-book-mobile.target.png", "book-mobile.target.png"],
  ["soft-studio", "w5-beauty-soft-studio-book-mobile.target.png", "book-mobile.target.png"],
  ["editorial", "w5-beauty-editorial-book-mobile.target.png", "book-mobile.target.png"],
  ["premium-dark", "w5-beauty-premium-dark-book-mobile.target.png", "book-mobile.target.png"],
];

console.log("\nBeauty target visuals (W4 + W5)\n");
const done = new Set();
for (const [preset, src, dest] of W4_MAP) {
  const key = `w4/${preset}/${dest}`;
  if (done.has(key)) continue;
  const before = existsSync(join(beautyW4, preset, dest));
  install(beautyW4, preset, src, dest);
  if (!before && existsSync(join(beautyW4, preset, dest))) done.add(key);
}
for (const [preset, src, dest] of W5_MAP) {
  install(beautyW5, preset, src, dest);
}

const candidates = join(beautyW4, "_candidates");
if (existsSync(candidates)) {
  rmSync(candidates, { recursive: true, force: true });
  console.log("\n  removed _candidates/ (noir-dusk promoted)\n");
}
