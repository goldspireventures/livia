import {
  listPresentationPresets,
  resolvePresentationPreset,
  isValidPresentationPreset,
  presentationPresetsEnabled,
  PLATFORM_DEFAULT_PRESET_ID,
  type BusinessVertical,
} from "@workspace/policy";
import { getBusinessById, updateBusiness } from "./businesses.service";

export async function getPresentationForBusiness(businessId: string) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  const vertical = biz.vertical as BusinessVertical;
  const presetId = biz.presentationPresetId ?? PLATFORM_DEFAULT_PRESET_ID;
  const preset = resolvePresentationPreset(vertical, presetId);
  return {
    businessId,
    vertical,
    presetId: preset.id,
    preset,
    brandAccentHex: biz.brandAccentHex ?? null,
    presetsEnabled: presentationPresetsEnabled(),
    availablePresets: listPresentationPresets(vertical),
  };
}

export async function patchPresentationForBusiness(
  businessId: string,
  input: { presentationPresetId?: string; brandAccentHex?: string | null },
) {
  if (!presentationPresetsEnabled()) {
    throw new Error("PRESENTATION_PRESETS_DISABLED");
  }
  const biz = await getBusinessById(businessId);
  if (!biz) return null;

  const patch: {
    presentationPresetId?: string;
    brandAccentHex?: string | null;
  } = {};

  if (input.presentationPresetId !== undefined) {
    const vertical = biz.vertical as BusinessVertical;
    if (!isValidPresentationPreset(vertical, input.presentationPresetId)) {
      throw new Error("INVALID_PRESET");
    }
    patch.presentationPresetId = input.presentationPresetId;
  }

  if (input.brandAccentHex !== undefined) {
    if (
      input.brandAccentHex !== null &&
      input.brandAccentHex !== "" &&
      !/^#[0-9A-Fa-f]{6}$/.test(input.brandAccentHex)
    ) {
      throw new Error("INVALID_ACCENT_HEX");
    }
    patch.brandAccentHex = input.brandAccentHex || null;
  }

  if (Object.keys(patch).length === 0) return getPresentationForBusiness(businessId);
  await updateBusiness(businessId, patch);
  return getPresentationForBusiness(businessId);
}
