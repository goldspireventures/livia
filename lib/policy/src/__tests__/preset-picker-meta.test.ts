import assert from "node:assert/strict";
import { PRESENTATION_PRESETS, PLATFORM_DEFAULT_PRESET_ID } from "../presentation-presets";
import { resolvePresetPickerMeta } from "../preset-picker-meta";
import type { BusinessVertical } from "../types";

for (const vertical of Object.keys(PRESENTATION_PRESETS) as BusinessVertical[]) {
  for (const preset of PRESENTATION_PRESETS[vertical]) {
    if (preset.id === PLATFORM_DEFAULT_PRESET_ID) continue;
    if (preset.pickerVisible === false) continue;
    const meta = resolvePresetPickerMeta(vertical, preset.id);
    assert.ok(meta, `${vertical}: missing picker meta for ${preset.id}`);
    assert.ok(meta.operatorIntent.length > 10, `${preset.id}: operatorIntent too short`);
    assert.ok(meta.guestIntent.length > 10, `${preset.id}: guestIntent too short`);
  }
}

console.log("preset-picker-meta.test.ts OK");
