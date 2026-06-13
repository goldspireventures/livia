import type { PresentationLayoutMorph } from "@workspace/policy";
import {
  isBeautyPresentationPreset,
  isEventVendorPresentationPreset,
  isWellnessPresentationPreset,
  resolvePresentationLayoutMorphSafe,
} from "@/lib/presentation-layout";
import {
  resolvePresentationColorMode,
  resolvePresentationMobileColors,
  type PresentationColorOverrides,
} from "@/lib/presentation-preset-colors";

export type TenantPresentationSurface = {
  vertical: string | null;
  category: string | null;
  effectiveCssPreset: string;
  layoutMorph: PresentationLayoutMorph;
  colorOverrides: PresentationColorOverrides;
  isBeautyNative: boolean;
  isWellnessNative: boolean;
  isEventVendorNative: boolean;
  isConstellation: boolean;
  colorMode: "light" | "dark";
};

/**
 * Mobile hub for W4 tenant skin — mirrors web `applyTenantPresentationSurface` without DOM.
 * Policy preset + brand accent + layout morph propagate from one resolver.
 */
export function resolveTenantPresentationSurface(args: {
  vertical?: string | null;
  category?: string | null;
  cssPreset?: string | null;
  brandAccentHex?: string | null;
  colorMode?: "light" | "dark" | null;
}): TenantPresentationSurface {
  const vertical = args.vertical ?? null;
  const effectiveCssPreset = args.cssPreset ?? "platform-default";
  const layoutMorph = resolvePresentationLayoutMorphSafe(vertical, effectiveCssPreset);
  const colorMode =
    args.colorMode ??
    resolvePresentationColorMode(effectiveCssPreset) ??
    "dark";
  const colorOverrides = resolvePresentationMobileColors(
    effectiveCssPreset,
    args.brandAccentHex,
    colorMode,
  );
  const isBeautyNative = vertical === "beauty" && isBeautyPresentationPreset(effectiveCssPreset);
  const isWellnessNative =
    vertical === "wellness" && isWellnessPresentationPreset(effectiveCssPreset);
  const isEventVendorNative =
    vertical === "event-vendors" && isEventVendorPresentationPreset(effectiveCssPreset);
  const isConstellation =
    effectiveCssPreset === "platform-default" &&
    !isBeautyNative &&
    !isWellnessNative &&
    !isEventVendorNative;

  return {
    vertical,
    category: args.category ?? null,
    effectiveCssPreset,
    layoutMorph,
    colorOverrides,
    isBeautyNative,
    isWellnessNative,
    isEventVendorNative,
    isConstellation,
    colorMode,
  };
}
