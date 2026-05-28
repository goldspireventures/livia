import { resolveVerticalKey, type BusinessVertical } from "@workspace/policy";

/** Accent hex for mobile chrome — mirrors web `vertical-theme.ts` tokens. */
export const VERTICAL_ACCENT_HEX: Record<BusinessVertical, string> = {
  hair: "#D4A72C",
  beauty: "#EC4899",
  "body-art": "#F97316",
  wellness: "#14B8A6",
  fitness: "#22C55E",
  medspa: "#A78BFA",
  "allied-health": "#0EA5E9",
  "pet-grooming": "#A855F7",
  "automotive-detailing": "#94A3B8",
};

export function verticalAccentHex(
  vertical: string | undefined | null,
  category?: string | null,
): string {
  const key = resolveVerticalKey(vertical, category);
  return VERTICAL_ACCENT_HEX[key];
}
