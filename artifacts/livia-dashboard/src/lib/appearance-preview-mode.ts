import { resolvePresentationColorMode } from "@/lib/experience-theme";

/** Store appearance iframe — real /dashboard Today, not a scaled mock. */
export function isAppearanceEmbed(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("appearanceEmbed") === "1";
}

export function readAppearancePreviewParams(search?: string): {
  isPreview: boolean;
  cssPreset: string | null;
  brandAccentHex: string | null;
} {
  const params = new URLSearchParams(search ?? (typeof window !== "undefined" ? window.location.search : ""));
  return {
    isPreview: params.get("preview") === "1",
    cssPreset: params.get("preset")?.trim() || null,
    brandAccentHex: params.get("accent")?.trim() || null,
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
  return isAppearanceEmbed();
}
