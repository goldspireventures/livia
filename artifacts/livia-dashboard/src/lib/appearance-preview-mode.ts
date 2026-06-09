import {
  applyTenantPresentationSurface,
  resolvePresentationColorMode,
} from "@/lib/experience-theme";
import {
  resolvePresentationLayoutMorph,
  type BusinessVertical,
  type PresentationLayoutMorph,
} from "@workspace/policy";

/** Store appearance iframe — real /dashboard Today, not a scaled mock. */
export function isAppearanceEmbed(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("appearanceEmbed") === "1";
}

export function readAppearancePreviewParams(search?: string): {
  isPreview: boolean;
  cssPreset: string | null;
  brandAccentHex: string | null;
  vertical: string | null;
} {
  const params = new URLSearchParams(search ?? (typeof window !== "undefined" ? window.location.search : ""));
  return {
    isPreview: params.get("preview") === "1",
    cssPreset: params.get("preset")?.trim() || null,
    brandAccentHex: params.get("accent")?.trim() || null,
    vertical: params.get("vertical")?.trim() || null,
  };
}

export function appearancePreviewDashboardPath(previewQuery: string): string {
  const qs = previewQuery ? `appearanceEmbed=1&${previewQuery}` : "appearanceEmbed=1&preview=1";
  return `/dashboard?${qs}`;
}

export function resolveAppearancePreviewColorMode(cssPreset: string | null) {
  return cssPreset ? resolvePresentationColorMode(cssPreset) : null;
}

/**
 * Draft preset/accent must only render inside preview iframes (`?preview=1&preset=…`).
 * Live W4 shell + `/b` use saved presentation until owner clicks Apply.
 */
export function shouldApplyUrlPreviewToDocument(): boolean {
  return isAppearanceEmbed() || readAppearancePreviewParams().isPreview;
}

/**
 * Apply draft presentation from URL (settings iframe). Returns true when preview mode ran.
 */
/**
 * Saved preset from API, or draft `preset=` from settings / appearance embed iframes.
 * Keeps Today morph + `/b` preview aligned with the picker before Apply.
 */
export function effectivePresentationMorph(
  vertical: string | null | undefined,
  savedPresetId?: string | null,
): PresentationLayoutMorph | null {
  if (!vertical) return null;
  const v = vertical as BusinessVertical;
  const draft = readAppearancePreviewParams();
  if ((draft.isPreview || isAppearanceEmbed()) && draft.cssPreset) {
    return resolvePresentationLayoutMorph(v, draft.cssPreset);
  }
  if (savedPresetId) {
    return resolvePresentationLayoutMorph(v, savedPresetId);
  }
  return null;
}

export function applyAppearancePreviewFromSearch(
  search?: string,
  fallback?: { vertical?: string | null; category?: string | null; country?: string | null },
): boolean {
  const draft = readAppearancePreviewParams(search);
  if (!draft.isPreview || !draft.cssPreset) return false;

  const vertical = draft.vertical ?? fallback?.vertical ?? null;
  applyTenantPresentationSurface({
    vertical,
    category: fallback?.category ?? null,
    country: fallback?.country ?? null,
    cssPreset: draft.cssPreset,
    brandAccentHex: draft.brandAccentHex,
    colorMode: resolvePresentationColorMode(draft.cssPreset),
  });
  return true;
}
