#!/usr/bin/env node
/**
 * Scaffold + copy vertical target mocks from Cursor assets → docs/design/assets.
 * Run: node scripts/organize-vertical-target-mocks.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const home = process.env.USERPROFILE ?? process.env.HOME ?? "";
const cursorAssets = join(home, ".cursor/projects/c-Users-eamon-Personal-Projects-apps-Livia/assets");

const VERTICALS = {
  hair: { default: "warm-chair", presets: ["warm-chair", "clean-salon", "barber-bold"] },
  beauty: { default: "noir-dusk", presets: ["noir-dusk", "soft-studio", "editorial", "premium-dark"], skip: true },
  "body-art": {
    default: "studio-dark",
    presets: ["studio-dark", "flash-light", "minimal-mono"],
    w4Extra: ["design-proofs"],
    w5Extra: ["proof-mobile"],
  },
  wellness: { default: "spa-calm", presets: ["spa-calm", "zen-light", "retreat-dark"], w5Extra: ["visit-mobile"] },
  fitness: { default: "gym-bold", presets: ["gym-bold", "studio-clean", "coach-compact"], w4Extra: ["classes"] },
  medspa: {
    default: "clinical-calm",
    presets: ["clinical-calm", "luxury-serif", "minimal-consent"],
    w4Extra: ["medspa-hub"],
    w5Extra: ["intake-mobile"],
  },
  "allied-health": {
    default: "clinic-standard",
    presets: ["clinic-standard", "practice-warm", "compact-desk"],
  },
  "pet-grooming": { default: "playful-paw", presets: ["playful-paw", "clean-groom", "mobile-van"] },
  "automotive-detailing": {
    default: "bay-industrial",
    presets: ["bay-industrial", "showroom-light", "compact-mobile"],
  },
};

const CORE = [
  ["web", "dashboard-owner-solo"],
  ["web", "settings-appearance-owner"],
  ["mobile", "dashboard-owner-solo"],
  ["mobile", "book-mobile"],
];

function dest(vertical, preset, platform, name) {
  const world = platform === "book-mobile" || name.includes("proof") || name.includes("intake") || name.includes("visit")
    ? join(root, "docs/design/assets/w5-public", vertical, "presets", preset, platform)
    : join(root, "docs/design/assets/w4-tenant", vertical, "presets", preset, platform);
  if (name === "book-mobile" || name.includes("proof") || name.includes("intake") || name.includes("visit")) {
    return join(root, "docs/design/assets/w5-public", vertical, "presets", preset, platform, `${name}.sample.png`);
  }
  return join(root, "docs/design/assets/w4-tenant", vertical, "presets", preset, platform, `${name}.sample.png`);
}

function w5dest(vertical, preset, platform, name) {
  const dir = join(root, "docs/design/assets/w5-public", vertical, "presets", preset, platform);
  mkdirSync(dir, { recursive: true });
  return join(dir, `${name}.sample.png`);
}

function w4dest(vertical, preset, platform, name) {
  const dir = join(root, "docs/design/assets/w4-tenant", vertical, "presets", preset, platform);
  mkdirSync(dir, { recursive: true });
  return join(dir, `${name}.sample.png`);
}

let created = 0;
for (const [vertical, cfg] of Object.entries(VERTICALS)) {
  if (cfg.skip) continue;
  for (const preset of cfg.presets) {
    for (const [platform, name] of CORE) {
      const isW5 = name === "book-mobile";
      const path = isW5 ? w5dest(vertical, preset, platform, name) : w4dest(vertical, preset, platform, name);
      if (!existsSync(path)) {
        mkdirSync(dirname(path), { recursive: true });
      }
    }
    if (preset === cfg.default) {
      for (const extra of cfg.w4Extra ?? []) {
        w4dest(vertical, preset, "web", extra);
      }
      for (const extra of cfg.w5Extra ?? []) {
        w5dest(vertical, preset, "mobile", extra);
      }
    }
  }
  const readme = join(root, "docs/design/assets/w4-tenant", vertical, "README.md");
  if (!existsSync(readme)) {
    mkdirSync(dirname(readme), { recursive: true });
    const lines = [
      `# ${vertical} — W4/W5 target mocks`,
      "",
      `Default preset: \`${cfg.default}\``,
      "",
      "See [`../../VERTICAL-TARGET-MOCK-PROGRAM.md`](../../VERTICAL-TARGET-MOCK-PROGRAM.md).",
      "",
      "Review `.sample.png` → delete rejects → rename to `.target.png`.",
      "",
    ];
    writeFileSync(readme, lines.join("\n"));
  }
  created++;
}

function parseMockFilename(f) {
  for (const world of ["w4", "w5"]) {
    if (!f.startsWith(`${world}-`) || !f.endsWith(".sample.png")) continue;
    const rest = f.slice(world.length + 1, -".sample.png".length);
    const dot = rest.lastIndexOf(".");
    if (dot < 0) continue;
    const platform = rest.slice(dot + 1);
    const mid = rest.slice(0, dot);
    for (const vertical of Object.keys(VERTICALS)) {
      if (!mid.startsWith(`${vertical}-`)) continue;
      const after = mid.slice(vertical.length + 1);
      const preset = (VERTICALS[vertical].presets ?? []).find((p) => after.startsWith(`${p}-`));
      if (!preset) continue;
      const surface = after.slice(preset.length + 1);
      return { world, vertical, preset, platform, surface };
    }
  }
  return null;
}

if (existsSync(cursorAssets)) {
  let copied = 0;
  for (const f of readdirSync(cursorAssets)) {
    const parsed = parseMockFilename(f);
    if (!parsed) continue;
    const { world, vertical, preset, platform, surface } = parsed;
    if (VERTICALS[vertical]?.skip) continue;
    const target =
      world === "w5" || surface === "book-mobile"
        ? w5dest(vertical, preset, platform, surface)
        : w4dest(vertical, preset, platform, surface);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(cursorAssets, f), target);
    copied++;
  }
  console.log(`Copied ${copied} files from cursor assets`);
}

console.log(`Scaffolded ${created} verticals. Cursor assets: ${cursorAssets}`);
console.log("See docs/design/VERTICAL-TARGET-MOCK-PROGRAM.md");
