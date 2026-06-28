/**
 * Mobile surface → atmosphere + colours. Preset authority lives in `@workspace/policy`.
 */
import {
  MOBILE_PRE_AUTH_SURFACES,
  type MobilePreAuthSurfaceId,
} from "@workspace/policy";
import {
  PRESENTATION_PRESET_MOBILE,
  resolvePresentationMobileColors,
  type PresentationColorOverrides,
} from "@/lib/presentation-preset-colors";
import { gatewayTheme } from "@/lib/gateway-theme";

export type MobileSurfaceAtmosphere = "g1" | "constellation" | "guest";

export type ResolvedMobileSurface = {
  id: MobilePreAuthSurfaceId;
  atmosphere: MobileSurfaceAtmosphere;
  colors: PresentationColorOverrides & { background: string };
  cssPreset: string;
  webShell: string;
};

const ATMOSPHERE_BY_SURFACE: Record<MobilePreAuthSurfaceId, MobileSurfaceAtmosphere> = {
  /** Production cold open — platform-default constellation (not G1 demo ink). */
  "gateway-cold-open": "constellation",
  "demo-g1": "g1",
  "gateway-auth": "constellation",
  "guest-hub": "guest",
};

/** Resolve pre-auth shell tokens for a mobile surface id. */
export function resolveMobilePreAuthSurfacePresentation(
  surfaceId: MobilePreAuthSurfaceId,
): ResolvedMobileSurface {
  const spec = MOBILE_PRE_AUTH_SURFACES[surfaceId];
  const presetId = spec.presentationPresetId;
  const base = resolvePresentationMobileColors(presetId, null);
  const atmosphere = ATMOSPHERE_BY_SURFACE[surfaceId];

  let background = base.background ?? gatewayTheme.platformInk;
  if (atmosphere === "g1") {
    background = gatewayTheme.g1Background;
  }

  const colors = {
    ...base,
    background,
    ...(atmosphere === "g1"
      ? {
          card: "rgba(255, 255, 255, 0.06)",
          border: "rgba(255, 255, 255, 0.12)",
          mutedForeground: "rgba(255, 255, 255, 0.62)",
        }
      : {}),
  };

  return {
    id: surfaceId,
    atmosphere,
    colors,
    cssPreset: presetId,
    webShell: spec.webShell,
  };
}

export function mobileSurfaceColors(surfaceId: MobilePreAuthSurfaceId) {
  return resolveMobilePreAuthSurfacePresentation(surfaceId).colors;
}

export { PRESENTATION_PRESET_MOBILE };
