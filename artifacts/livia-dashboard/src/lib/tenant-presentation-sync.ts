import type { QueryClient } from "@tanstack/react-query";
import {
  applyTenantPresentationSurface,
  resolvePresentationColorMode,
} from "@/lib/experience-theme";
import type { PersonaKind } from "@/lib/persona";
import { tenantExperienceQueryKey } from "@/lib/prefetch-tenant-dashboard";
import type { TenantExperienceResponse } from "@/lib/tenant-experience-api";

const SESSION_KEY = "livia.tenantPresentationSkin.v1";

export type TenantPresentationSkin = {
  businessId: string;
  vertical?: string | null;
  category?: string | null;
  country?: string | null;
  cssPreset: string;
  brandAccentHex?: string | null;
  colorMode?: "light" | "dark" | null;
};

function readSessionSkin(businessId: string): TenantPresentationSkin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TenantPresentationSkin;
    if (parsed.businessId !== businessId || !parsed.cssPreset) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistTenantPresentationSkin(skin: TenantPresentationSkin): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(skin));
  } catch {
    // sessionStorage may be unavailable
  }
}

export function resolveTenantPresentationSkin(
  queryClient: QueryClient,
  businessId: string,
  business?: {
    vertical?: string | null;
    category?: string | null;
    country?: string | null;
  } | null,
): TenantPresentationSkin | null {
  const fromSession = readSessionSkin(businessId);
  if (fromSession) return fromSession;

  const te = queryClient.getQueryData<TenantExperienceResponse>(
    tenantExperienceQueryKey(businessId),
  );
  if (te?.presentation?.cssPreset) {
    const p = te.presentation;
    const colorMode =
      p.tokens?.colorMode === "light" || p.tokens?.colorMode === "dark"
        ? p.tokens.colorMode
        : resolvePresentationColorMode(p.cssPreset) ?? null;
    return {
      businessId,
      vertical: te.vertical ?? business?.vertical ?? null,
      category: business?.category ?? null,
      country: business?.country ?? null,
      cssPreset: p.cssPreset,
      brandAccentHex: p.brandAccentHex,
      colorMode,
    };
  }

  if (!business?.vertical && !business?.category) return null;

  return {
    businessId,
    vertical: business.vertical ?? null,
    category: business.category ?? null,
    country: business.country ?? null,
    cssPreset: "platform-default",
    brandAccentHex: null,
    colorMode: resolvePresentationColorMode("platform-default") ?? "dark",
  };
}

/** Single hub — tenant W4 skin on authenticated surfaces (all verticals). */
export function applyTenantPresentationSkin(
  skin: TenantPresentationSkin,
  persona?: PersonaKind | null,
): void {
  applyTenantPresentationSurface({
    vertical: skin.vertical,
    category: skin.category,
    country: skin.country,
    persona: persona ?? null,
    cssPreset: skin.cssPreset,
    brandAccentHex: skin.brandAccentHex,
    colorMode: skin.colorMode ?? null,
  });
  persistTenantPresentationSkin(skin);
}

export function warmTenantPresentationSkin(
  queryClient: QueryClient,
  businessId: string,
  business?: {
    vertical?: string | null;
    category?: string | null;
    country?: string | null;
  } | null,
  persona?: PersonaKind | null,
): boolean {
  const skin = resolveTenantPresentationSkin(queryClient, businessId, business);
  if (!skin) return false;
  applyTenantPresentationSkin(skin, persona);
  return true;
}
