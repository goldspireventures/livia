import type { PresentationLayoutMorph } from "@workspace/policy";
import {
  beautyNativeMorphForVertical,
  eventVendorNativeMorphForVertical,
  wellnessNativeMorphForVertical,
} from "@/lib/presentation-layout";
import type { TenantPresentationSurface } from "@/lib/tenant-presentation-surface";

/** Native skin family — not a web CSS port. */
export type MobileSkinFamily =
  | "constellation"
  | "beauty-native"
  | "wellness-native"
  | "event-vendor-native"
  | "aurora-dark"
  | "aurora-light";

/** Fixed shell atmosphere behind operator tabs. */
export type MobileAtmosphere =
  | "constellation-shell"
  | "wellness-breath"
  | "beauty-glow"
  | "aurora-halo"
  | "none";

export type MobileTabBarChrome = "frosted-glass" | "solid";

export type MobileOwnerTodayVariant =
  | "constellation"
  | "beauty-morph"
  | "wellness-morph"
  | "event-vendor-morph"
  | "standard";

export type MobileSkin = TenantPresentationSurface & {
  family: MobileSkinFamily;
  atmosphere: MobileAtmosphere;
  tabBarChrome: MobileTabBarChrome;
  /** Shell uses transparent scroll surfaces over atmosphere. */
  transparentScreens: boolean;
  /** Constellation + beauty/wellness: vertical ritual accent on chrome, not preset primary. */
  ritualAccentFromVertical: boolean;
};

function resolveSkinFamily(surface: TenantPresentationSurface): MobileSkinFamily {
  if (surface.isConstellation) return "constellation";
  if (surface.isBeautyNative) return "beauty-native";
  if (surface.isWellnessNative) return "wellness-native";
  if (surface.isEventVendorNative) return "event-vendor-native";
  return surface.colorMode === "light" ? "aurora-light" : "aurora-dark";
}

function resolveAtmosphere(family: MobileSkinFamily): MobileAtmosphere {
  switch (family) {
    case "constellation":
      return "constellation-shell";
    case "wellness-native":
      return "wellness-breath";
    case "beauty-native":
      return "beauty-glow";
    case "event-vendor-native":
      return "aurora-halo";
    case "aurora-dark":
      return "aurora-halo";
    default:
      return "none";
  }
}

/**
 * Layer-5 interpreter: same tenant appearance settings as web, native render contract.
 * Input: hub resolver output (`resolveTenantPresentationSurface`).
 * Output: which atmosphere, chrome, and Today morph the Expo app should use.
 */
export function resolveMobileSkin(surface: TenantPresentationSurface): MobileSkin {
  const family = resolveSkinFamily(surface);
  const atmosphere = resolveAtmosphere(family);
  const transparentScreens =
    family === "constellation" ||
    family === "wellness-native" ||
    family === "beauty-native" ||
    family === "event-vendor-native";
  const ritualAccentFromVertical =
    family === "constellation" &&
    (surface.vertical === "beauty" || surface.vertical === "wellness");

  return {
    ...surface,
    family,
    atmosphere,
    tabBarChrome: transparentScreens ? "frosted-glass" : "solid",
    transparentScreens,
    ritualAccentFromVertical,
  };
}

/** Owner/manager Today home — persona layer on top of inherited preset. */
export function resolveMobileOwnerTodayVariant(
  skin: MobileSkin,
  persona: string,
  layoutMorph: PresentationLayoutMorph,
): MobileOwnerTodayVariant {
  const ownerLike = persona === "owner" || persona === "manager" || persona === "org_admin";
  if (!ownerLike) return "standard";

  const beautyMorph = beautyNativeMorphForVertical(skin.vertical, layoutMorph);
  const wellnessMorph = wellnessNativeMorphForVertical(skin.vertical, layoutMorph);
  const eventMorph = eventVendorNativeMorphForVertical(skin.vertical, layoutMorph);
  if (beautyMorph) return "beauty-morph";
  if (wellnessMorph) return "wellness-morph";
  if (eventMorph) return "event-vendor-morph";
  if (skin.family === "constellation" && (persona === "owner" || persona === "org_admin")) {
    return "constellation";
  }
  return "standard";
}
