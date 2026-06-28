/**
 * Pre-auth mobile shells — map W2/W4/W6 routes to presentation presets (policy hub).
 * Mobile interprets atmosphere; preset colours come from `presentation-presets.ts`.
 *
 * @see docs/design/GATEWAY-SURFACE-PROGRAM.md
 * @see artifacts/livia-mobile/lib/mobile-surface-presets.ts
 */
import { PLATFORM_DEFAULT_PRESET_ID } from "./presentation-presets";

export type MobilePreAuthSurfaceId =
  | "gateway-cold-open"
  | "gateway-auth"
  | "guest-hub"
  | "demo-g1";

export type MobilePreAuthSurfaceSpec = {
  id: MobilePreAuthSurfaceId;
  /** Owner preset — mobile merges via `resolvePresentationMobileColors`. */
  presentationPresetId: typeof PLATFORM_DEFAULT_PRESET_ID;
  /** Web shell parity reference (documentation / audits). */
  webShell: string;
};

export const MOBILE_PRE_AUTH_SURFACES: Record<MobilePreAuthSurfaceId, MobilePreAuthSurfaceSpec> = {
  "gateway-cold-open": {
    id: "gateway-cold-open",
    presentationPresetId: PLATFORM_DEFAULT_PRESET_ID,
    webShell: "W4 cold open · two doors",
  },
  "gateway-auth": {
    id: "gateway-auth",
    presentationPresetId: PLATFORM_DEFAULT_PRESET_ID,
    webShell: "GatewayAuthPageShell · sign-in / sign-up",
  },
  "guest-hub": {
    id: "guest-hub",
    presentationPresetId: PLATFORM_DEFAULT_PRESET_ID,
    webShell: "guest-hub-platform · My Livia",
  },
  "demo-g1": {
    id: "demo-g1",
    presentationPresetId: PLATFORM_DEFAULT_PRESET_ID,
    webShell: "gateway-g1-root · /demo launcher",
  },
};

export function resolveMobilePreAuthSurface(id: MobilePreAuthSurfaceId): MobilePreAuthSurfaceSpec {
  return MOBILE_PRE_AUTH_SURFACES[id];
}
