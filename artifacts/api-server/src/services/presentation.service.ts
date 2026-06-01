import {
  listPresentationPresetsForTenantPicker,
  resolvePresentationPreset,
  isValidPresentationPreset,
  presetPreservesVerticalGates,
  presentationPresetsActive,
  PLATFORM_DEFAULT_PRESET_ID,
  type BusinessVertical,
} from "@workspace/policy";
import { getBusinessById, updateBusiness } from "./businesses.service";
import { publicFeaturedPatch, readPublicFeaturedServiceIds } from "../lib/business-public-featured";

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
    publicFeaturedServiceIds: readPublicFeaturedServiceIds(biz),
    presetsEnabled: presentationPresetsActive(),
    availablePresets: listPresentationPresetsForTenantPicker(vertical),
  };
}

export async function patchPresentationForBusiness(
  businessId: string,
  input: { presentationPresetId?: string; brandAccentHex?: string | null },
) {
  if (!presentationPresetsActive()) {
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
    if (!presetPreservesVerticalGates(vertical, input.presentationPresetId)) {
      throw new Error("PRESET_DROPS_VERTICAL_GATES");
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

const MAX_PUBLIC_FEATURED = 4;

export async function patchPublicFeaturedServices(
  businessId: string,
  serviceIds: string[],
) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  const unique = [...new Set(serviceIds.filter((id) => typeof id === "string" && id.trim()))].slice(
    0,
    MAX_PUBLIC_FEATURED,
  );
  await updateBusiness(businessId, publicFeaturedPatch(unique) as Parameters<typeof updateBusiness>[1]);
  return { businessId, publicFeaturedServiceIds: unique };
}
