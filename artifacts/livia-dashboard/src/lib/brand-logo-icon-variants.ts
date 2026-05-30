/**
 * App-icon-only variants for Thread L & Open Arc (nav/wordmark unchanged).
 * @see docs/design/BRAND-LOGO-CONCEPTS.md
 */

export type IconConceptFamily = "thread-l" | "open-arc";

export interface LogoIconVariant {
  id: string;
  family: IconConceptFamily;
  name: string;
  tagline: string;
}

export const THREAD_ICON_VARIANTS: LogoIconVariant[] = [
  {
    id: "thread-spool-wrap",
    family: "thread-l",
    name: "Spool wrap",
    tagline: "Thread wraps once around the L corner — craft / continuity",
  },
  {
    id: "thread-needle-loop",
    family: "thread-l",
    name: "Needle loop",
    tagline: "Stem passes through thread eye — precise, tactile",
  },
  {
    id: "thread-corner-curl",
    family: "thread-l",
    name: "Corner curl",
    tagline: "Single stroke L with inner curl — minimal, hand-drawn",
  },
];

export const OPEN_ARC_ICON_VARIANTS: LogoIconVariant[] = [
  {
    id: "arc-horizon-rise",
    family: "open-arc",
    name: "Horizon rise",
    tagline: "L bar + open horizon arc above — ongoing, not closed",
  },
  {
    id: "arc-swoosh-tail",
    family: "open-arc",
    name: "Swoosh tail",
    tagline: "Solid L + outward motion arc — momentum without badge",
  },
  {
    id: "arc-touchpoint",
    family: "open-arc",
    name: "Touchpoint",
    tagline: "Connection dot on stem + arc approaching — relationship",
  },
];

export const ICON_VARIANTS_BY_FAMILY: Record<IconConceptFamily, LogoIconVariant[]> = {
  "thread-l": THREAD_ICON_VARIANTS,
  "open-arc": OPEN_ARC_ICON_VARIANTS,
};

export function defaultIconVariant(family: IconConceptFamily): string {
  return ICON_VARIANTS_BY_FAMILY[family][0]!.id;
}

export function isIconFamily(conceptId: string): conceptId is IconConceptFamily {
  return conceptId === "thread-l" || conceptId === "open-arc";
}
