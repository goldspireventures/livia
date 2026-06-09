import type { BusinessVertical } from "./types";

/**
 * W4/W5 operator skin when stored preset is Platform Default.
 * Constellation is signup chrome — beauty day ops default to Noir Dusk unless the owner
 * explicitly picked soft-studio, editorial, or premium-dark.
 */
export const BEAUTY_OPERATOR_DEFAULT_CSS_PRESET = "noir-dusk";

export function resolveBeautyOperatorCssPreset(cssPreset?: string | null): string {
  if (!cssPreset || cssPreset === "platform-default") {
    return BEAUTY_OPERATOR_DEFAULT_CSS_PRESET;
  }
  return cssPreset;
}

/**
 * W4 beauty operator shell — inbox-first day ops + studio strip (Treatments in nav).
 * Mirrors wellness-operator-shell pattern; beauty keeps sidebar + beautyNav chrome.
 */
export type BeautyShellNavItem = {
  id: string;
  label: string;
  href: string;
};

/** Day operations — DM triage and floor. */
export const BEAUTY_FOREGROUND_NAV: readonly BeautyShellNavItem[] = [
  { id: "today", label: "Today", href: "/dashboard" },
  { id: "inbox", label: "Inbox", href: "/inbox" },
  { id: "floor", label: "Schedule", href: "/bookings" },
  { id: "clients", label: "Clients", href: "/customers" },
] as const;

/** Studio catalogue + team — treatments must be discoverable (P0). */
export function beautyStudioNav(
  treatmentLabel: string,
  teamNoun: string,
): BeautyShellNavItem[] {
  return [
    { id: "treatments", label: treatmentLabel, href: "/services" },
    { id: "team", label: teamNoun, href: "/staff" },
    { id: "settings", label: "Settings", href: "/settings" },
  ];
}

export function beautyShellNavItems(
  treatmentLabel: string,
  teamNoun: string,
): { foreground: BeautyShellNavItem[]; studio: BeautyShellNavItem[] } {
  return {
    foreground: [...BEAUTY_FOREGROUND_NAV],
    studio: beautyStudioNav(treatmentLabel, teamNoun),
  };
}

export function resolveBeautyShellActiveId(pathname: string): string | null {
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/staff")) return "team";
  if (pathname.startsWith("/services")) return "treatments";
  if (pathname.startsWith("/inbox")) return "inbox";
  if (pathname.startsWith("/bookings")) return "floor";
  if (pathname.startsWith("/customers")) return "clients";
  if (pathname.startsWith("/dashboard")) return "today";
  return null;
}

export function isBeautyOperatorShellVertical(vertical?: string | null): vertical is BusinessVertical {
  return vertical === "beauty";
}
