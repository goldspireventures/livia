/**
 * Maps live business signals to configuration codes (docs/configurations.md).
 * Drives persona rituals, founder surfaces, and lifecycle graduation hints.
 */

export type OrgConfigurationCode =
  | "C1"
  | "C2"
  | "C3"
  | "C4"
  | "C5"
  | "C6"
  | "C7"
  | "C8"
  | "C9"
  | "C10"
  | "C11"
  | "C12"
  | "C13";

export type OrgShapeSignals = {
  shopCount: number;
  activeStaffCount: number;
  hasAdminManager: boolean;
  hasSeniorWithAdmin: boolean;
  tier: string;
  structureKind: "standalone" | "location" | "brand_entity";
  hostRenterCount: number;
  brandEntityCount: number;
};

export type OrgShapeProfile = {
  code: OrgConfigurationCode;
  label: string;
  founderSurface: "my-chair" | "today" | "glance" | "host";
  livRung: "R1" | "R2" | "R3" | "R4";
  supportsChainGlance: boolean;
  supportsPremisesLink: boolean;
};

export function detectOrgConfiguration(signals: OrgShapeSignals): OrgConfigurationCode {
  if (signals.tier === "chair-host" || signals.hostRenterCount > 0) return "C10";
  if (signals.brandEntityCount >= 2 || signals.structureKind === "brand_entity") return "C13";
  if (signals.shopCount >= 16) return "C9";
  if (signals.shopCount >= 6) return "C8";
  if (signals.shopCount >= 2) return "C7";
  if (signals.hasSeniorWithAdmin && signals.hasAdminManager) return "C6";
  if (signals.hasAdminManager && signals.activeStaffCount >= 4) return "C5";
  if (signals.activeStaffCount >= 1) return "C4";
  if (signals.tier === "solo" && signals.activeStaffCount === 0) return "C2";
  return "C2";
}

export function orgShapeProfile(code: OrgConfigurationCode): OrgShapeProfile {
  switch (code) {
    case "C1":
      return {
        code,
        label: "Solo mobile",
        founderSurface: "my-chair",
        livRung: "R3",
        supportsChainGlance: false,
        supportsPremisesLink: false,
      };
    case "C4":
      return {
        code,
        label: "Single shop with team",
        founderSurface: "today",
        livRung: "R2",
        supportsChainGlance: false,
        supportsPremisesLink: true,
      };
    case "C5":
    case "C6":
      return {
        code,
        label: code === "C6" ? "Mature shop with floor lead" : "Shop with manager",
        founderSurface: "today",
        livRung: "R2",
        supportsChainGlance: false,
        supportsPremisesLink: true,
      };
    case "C7":
      return {
        code,
        label: "Small chain (2–5 shops)",
        founderSurface: "glance",
        livRung: "R4",
        supportsChainGlance: true,
        supportsPremisesLink: true,
      };
    case "C8":
    case "C9":
      return {
        code,
        label: code === "C9" ? "Large chain" : "Regional chain",
        founderSurface: "glance",
        livRung: "R4",
        supportsChainGlance: true,
        supportsPremisesLink: true,
      };
    case "C10":
      return {
        code,
        label: "Chair-rental host",
        founderSurface: "host",
        livRung: "R3",
        supportsChainGlance: false,
        supportsPremisesLink: true,
      };
    case "C13":
      return {
        code,
        label: "Multi-brand portfolio",
        founderSurface: "glance",
        livRung: "R4",
        supportsChainGlance: true,
        supportsPremisesLink: true,
      };
    default:
      return {
        code: "C2",
        label: "Solo shop",
        founderSurface: "my-chair",
        livRung: "R3",
        supportsChainGlance: false,
        supportsPremisesLink: true,
      };
  }
}

export function resolveOrgShapeProfile(signals: OrgShapeSignals): OrgShapeProfile {
  return orgShapeProfile(detectOrgConfiguration(signals));
}
