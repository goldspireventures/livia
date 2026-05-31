import type { PersonaKind } from "@/lib/persona";
import { apiFetch } from "@/lib/api-fetch";

export type DemoPersonaId =
  | "org_admin"
  | "owner"
  | "manager"
  | "staff-senior"
  | "staff-junior"
  | "receptionist"
  | "customer";

export type DemoCatalogPersona = {
  id: DemoPersonaId;
  email: string;
  displayName: string;
  roleLabel: string;
  landingPath: string;
  primaryBusinessSlug: string;
  requiresClerk: boolean;
  publicBookingUrl: string | null;
};

export type DemoScenarioAccount = {
  email: string;
  displayName: string;
  roleLabel: string;
  landingPath: string;
  primaryBusinessSlug: string;
  businessSlugs: string[];
};

/** One row per business on the platform — how you tour each tenant. */
export type DemoBusinessTenant = {
  slug: string;
  id: string;
  name: string;
  vertical?: string | null;
  country?: string | null;
  ownerEmail: string;
  ownerPersonaId?: DemoPersonaId | null;
  publicBookingUrl: string;
  roster?: DemoRosterEntry[];
};

export type DemoRosterEntry = {
  role: string;
  label: string;
  email: string;
  landingPath: string;
  personaId: string;
};

export type DemoScenarioSpotlight = {
  id: string;
  title: string;
  description: string;
  slug: string;
  structure: "solo" | "chain-hq" | "chain-location" | "franchise" | "chair-host";
};

export type DemoSignInResult = {
  token?: string;
  landingPath: string;
  businessId?: string;
  email: string;
  displayName: string;
  persona: DemoPersonaId;
  signInStrategy: "ticket" | "public";
};

const PERSONA_TO_KIND: Record<DemoPersonaId, PersonaKind | null> = {
  org_admin: "org_admin",
  owner: "owner",
  manager: "manager",
  "staff-senior": "staff",
  "staff-junior": "staff",
  receptionist: "receptionist",
  customer: null,
};

const STORAGE_BUSINESS = "livia.currentBusinessId";

export function demoPersonaToKind(id: DemoPersonaId): PersonaKind | null {
  return PERSONA_TO_KIND[id];
}

export async function fetchDemoCatalog() {
  return apiFetch<{
    personas: DemoCatalogPersona[];
    scenarioAccounts?: DemoScenarioAccount[];
    scenarios?: DemoScenarioSpotlight[];
    passwordHint?: string;
    sharedPassword?: string;
    devPassword?: string;
  }>("/demo/catalog");
}

export async function provisionDemoWorld() {
  return apiFetch<{
    personas: Array<{ id: string; email: string; clerkUserId: string | null }>;
    businesses: Array<{ slug: string; id: string; name: string }>;
    passwordHint: string;
  }>("/demo/provision", { method: "POST" });
}

/** Fast path — branding + service images only (~3–8s). No Clerk. Runs full provision if missing. */
export async function syncDemoWorld() {
  return apiFetch<{
    mode: "sync" | "full";
    provisioned: boolean;
    rosterAccounts?: number;
    clerkSynced?: number;
    brandingUpdated?: number;
    servicesUpdated?: number;
    liveDaysRefreshed?: number;
    bookingsAdded?: number;
    warnings?: string[];
    passwordHint: string;
    businesses: Array<{ slug: string; id: string; name: string }>;
  }>("/demo/sync", { method: "POST" });
}

/** Heavy path — Clerk passwords + roster memberships. Optional slug = one tenant only. */
export async function syncDemoLogins(slug?: string) {
  return apiFetch<{ clerkSynced: number; rosterAccounts: number }>("/demo/sync-logins", {
    method: "POST",
    body: JSON.stringify(slug ? { slug } : {}),
  });
}

export async function fetchDemoStatus() {
  return apiFetch<{
    provisioned: boolean;
    businesses: DemoBusinessTenant[];
    passwordHint: string;
    dashboardBase: string;
    internalBase: string;
    marketingBase: string;
    demoPasswordConfigured: boolean;
  }>("/demo/status");
}

export async function requestDemoSignInAsBusiness(slug: string) {
  return apiFetch<DemoSignInResult>("/demo/sign-in-business", {
    method: "POST",
    body: JSON.stringify({ slug }),
  });
}

export async function requestDemoSignIn(persona: DemoPersonaId) {
  return apiFetch<DemoSignInResult>("/demo/sign-in", {
    method: "POST",
    body: JSON.stringify({ persona }),
  });
}

export async function requestDemoSignInForBusiness(persona: DemoPersonaId, businessSlug: string) {
  return apiFetch<DemoSignInResult>("/demo/sign-in", {
    method: "POST",
    body: JSON.stringify({ persona, businessSlug }),
  });
}

export async function requestDemoQuickSignIn(email: string) {
  return apiFetch<DemoSignInResult>("/demo/quick-sign-in", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function requestDemoSignInByEmail(email: string, password: string) {
  return apiFetch<DemoSignInResult>("/demo/sign-in-email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/** Apply post-ticket session context (business + dev persona shell). */
export function applyDemoSessionContext(result: DemoSignInResult) {
  if (result.businessId) {
    window.localStorage.setItem(STORAGE_BUSINESS, result.businessId);
  }
  if (result.persona === "staff-senior" || result.persona === "staff-junior") {
    window.sessionStorage.setItem("livia.demoStaffPersona", result.persona);
  }
}
