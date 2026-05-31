import type { PersonaKind } from "@/lib/persona";

export type SettingsTabId =
  | "shop"
  | "appearance"
  | "policy"
  | "liv"
  | "comms"
  | "team"
  | "billing"
  | "ownership"
  | "integrations"
  | "legal"
  | "demo";

export function settingsTabsForPersona(
  persona: PersonaKind,
  opts?: { showDemo?: boolean },
): SettingsTabId[] {
  const demo = opts?.showDemo ? (["demo"] as SettingsTabId[]) : [];
  switch (persona) {
    case "org_admin":
    case "owner":
      return [
        "shop",
        "appearance",
        "policy",
        "liv",
        "comms",
        "team",
        "billing",
        "ownership",
        "integrations",
        "legal",
        ...demo,
      ];
    case "manager":
      return ["comms", "shop", "appearance", "policy", "liv", "team", "legal"];
    case "receptionist":
      return ["comms", "shop", "legal"];
    case "staff":
      return ["shop", "legal"];
    default:
      return ["shop", "legal"];
  }
}

export function canEditShop(persona: PersonaKind): boolean {
  return persona === "org_admin" || persona === "owner";
}

export function canEditLiv(persona: PersonaKind): boolean {
  return persona === "org_admin" || persona === "owner" || persona === "manager";
}

export function canViewComms(persona: PersonaKind): boolean {
  return persona !== "staff";
}

export function canViewTeam(persona: PersonaKind): boolean {
  return persona === "org_admin" || persona === "owner" || persona === "manager";
}

export function canViewBilling(persona: PersonaKind): boolean {
  return persona === "org_admin" || persona === "owner";
}

/** Consistent tab labels — order in settingsTabsForPersona is the display order */
export const SETTINGS_TAB_LABELS: Record<SettingsTabId, string> = {
  shop: "Shop",
  appearance: "Public appearance",
  policy: "Policies",
  liv: "Liv AI",
  comms: "Channels",
  team: "Team",
  billing: "Plan & billing",
  ownership: "Ownership",
  integrations: "Integrations",
  legal: "Legal",
  demo: "Demo data",
};
