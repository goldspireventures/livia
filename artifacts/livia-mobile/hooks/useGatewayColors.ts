import { useMemo } from "react";
import colors, { aurora, aurum } from "@/constants/colors";
import { mobileSurfaceColors } from "@/lib/mobile-surface-presets";

/** @deprecated Prefer `useMobileSurface(surfaceId)` — kept for gateway forms. */
export function useGatewayColors() {
  return useMemo(() => {
    const preset = mobileSurfaceColors("gateway-auth");
    return { ...colors.dark, ...preset, radius: colors.radius, aurora, aurum };
  }, []);
}

/** @deprecated Prefer `useMobileSurface('demo-g1')` */
export function useG1GatewayColors() {
  return useMemo(() => {
    const preset = mobileSurfaceColors("demo-g1");
    return { ...colors.dark, ...preset, radius: colors.radius, aurora, aurum };
  }, []);
}
