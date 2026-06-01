import type { PersonaKind } from "@/lib/persona";

export type SettingsTabId =
  | "account"
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
  | "audit";

const ACCOUNT_FIRST: SettingsTabId[] = ["account"];

export function settingsTabsForPersona(persona: PersonaKind): SettingsTabId[] {
  switch (persona) {
    case "org_admin":
    case "owner":
      return [
        ...ACCOUNT_FIRST,
        "shop",
        "appearance",
        "liv",
        "comms",
        "billing",
        "ownership",
        "legal",
      ];
    case "manager":
      return [...ACCOUNT_FIRST, "comms", "shop", "appearance", "liv", "legal"];
    case "receptionist":
      return [...ACCOUNT_FIRST, "comms", "shop", "legal"];
    case "staff":
      return [...ACCOUNT_FIRST, "shop", "legal"];
    default:
      return [...ACCOUNT_FIRST, "shop", "legal"];
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
  account: "Account",
  shop: "Studio",
  appearance: "Appearance",
  audit: "Activity log",
  policy: "Policies",
  liv: "Liv",
  comms: "Channels",
  team: "Team",
  billing: "Plan",
  ownership: "Ownership",
  integrations: "Integrations",
  legal: "Legal",
};
