import {
  PRESENTATION_PRESETS,
  PLATFORM_DEFAULT_PRESET_ID,
  resolvePresentationLayoutMorph,
  validateVerticalPresentationPack,
} from "./index.ts";

const COMPLETED_VERTICALS = ["beauty", "wellness"] as const;

console.log("\nPreset morph audit\n");

let failed = 0;

for (const vertical of COMPLETED_VERTICALS) {
  const handshake = validateVerticalPresentationPack(vertical);
  if (!handshake.ok) {
    for (const e of handshake.errors) {
      failed += 1;
      console.log(`  [FAIL] ${vertical}: ${e}`);
    }
    continue;
  }
  console.log(
    `  [OK] ${vertical}: ${handshake.presetCount} presets · morphs ${handshake.morphs.join(", ")}`,
  );

  const presets = PRESENTATION_PRESETS[vertical];
  const native = presets.filter(
    (p) => p.id !== PLATFORM_DEFAULT_PRESET_ID && p.pickerVisible !== false,
  );
  const morphSet = new Set(native.map((p) => resolvePresentationLayoutMorph(vertical, p.id)));
  if (morphSet.size !== native.length) {
    failed += 1;
    console.log(`  [FAIL] ${vertical}: duplicate morphs across picker-visible presets`);
  }

  for (const preset of presets) {
    const morph = resolvePresentationLayoutMorph(vertical, preset.id);
    console.log(`  [OK]   ${preset.label} → ${morph}`);
  }
}

console.log(failed ? `\n${failed} issue(s).\n` : "\nAll completed vertical presets have distinct layout morphs.\n");
process.exit(failed ? 1 : 0);
