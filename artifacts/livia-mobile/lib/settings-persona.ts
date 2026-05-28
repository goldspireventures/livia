import type { PersonaKind } from "@/hooks/usePersona";

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

export function canViewAudit(persona: PersonaKind): boolean {
  return persona === "org_admin" || persona === "owner";
}

export function canViewLifecycle(persona: PersonaKind): boolean {
  return persona === "org_admin" || persona === "owner";
}

export function canViewPolicy(persona: PersonaKind): boolean {
  return persona === "org_admin" || persona === "owner" || persona === "manager";
}

export function canViewPremises(
  persona: PersonaKind,
  business?: { tier?: string | null; premisesSharing?: boolean | null },
): boolean {
  if (persona !== "org_admin" && persona !== "owner") return false;
  if (business?.premisesSharing === false) return false;
  if (business?.tier === "chair-host") return true;
  return business?.premisesSharing === true;
}

export function canViewDayPackages(persona: PersonaKind): boolean {
  return persona === "org_admin" || persona === "owner" || persona === "manager";
}
