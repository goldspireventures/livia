import { useMemo } from "react";
import colors, { aurora, aurum } from "@/constants/colors";
import {
  resolveMobilePreAuthSurfacePresentation,
  type MobileSurfaceAtmosphere,
} from "@/lib/mobile-surface-presets";
import type { MobilePreAuthSurfaceId } from "@workspace/policy";

export function useMobileSurface(surfaceId: MobilePreAuthSurfaceId) {
  return useMemo(() => {
    const resolved = resolveMobilePreAuthSurfacePresentation(surfaceId);
    return {
      ...resolved,
      tokens: {
        ...colors.dark,
        ...resolved.colors,
        radius: colors.radius,
        aurora,
        aurum,
      },
    };
  }, [surfaceId]);
}

export type MobileSurfaceContext = ReturnType<typeof useMobileSurface>;

export function surfaceAtmosphere(surfaceId: MobilePreAuthSurfaceId): MobileSurfaceAtmosphere {
  return resolveMobilePreAuthSurfacePresentation(surfaceId).atmosphere;
}
