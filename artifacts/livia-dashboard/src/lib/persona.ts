import { useEffect, useState } from "react";
import { useBusiness } from "./business-context";
import { useMembership, type Role } from "./membership-context";

export type PersonaKind =
  | "org_admin"
  | "owner"
  | "manager"
  | "staff"
  | "receptionist";

export const PERSONA_LABEL: Record<PersonaKind, string> = {
  org_admin: "Org admin · multi-location",
  owner: "Owner · single location",
  manager: "Manager · approvals",
  staff: "Staff · your chair",
  receptionist: "Front desk",
};

export const PERSONA_ACCENT: Record<PersonaKind, string> = {
  org_admin: "#d9c39a",
  owner: "#22d3ee",
  manager: "#a78bfa",
  staff: "#34d399",
  receptionist: "#818cf8",
};

export const ALL_PERSONAS: PersonaKind[] = [
  "org_admin",
  "owner",
  "manager",
  "staff",
  "receptionist",
];

const LS_KEY = "livia.devPersona";

function normalizeStoredPersona(raw: string | null): PersonaKind | null {
  if (!raw) return null;
  if (raw === "staff-senior" || raw === "staff-junior") return "staff";
  if (raw === "customer") return "owner";
  // Legacy internal id (pre org-admin rename)
  if (raw === "founder") return "org_admin";
  if (ALL_PERSONAS.includes(raw as PersonaKind)) return raw as PersonaKind;
  return null;
}

export const isDemoLoginEnabled =
  import.meta.env.VITE_DEMO_LOGIN === "true" || import.meta.env.DEV;

export function getDevPersonaOverride(): PersonaKind | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LS_KEY);
  const v = normalizeStoredPersona(raw);
  if (raw && v && raw !== v) {
    window.localStorage.setItem(LS_KEY, v);
  }
  return v;
}

export function setDevPersonaOverride(p: PersonaKind | null): void {
  if (typeof window === "undefined") return;
  if (p) window.localStorage.setItem(LS_KEY, p);
  else window.localStorage.removeItem(LS_KEY);
  window.dispatchEvent(new CustomEvent("livia:devPersonaChange", { detail: p }));
}

export function deriveAutoPersona(args: {
  role: Role | null;
  businessCount: number;
  businesses?: Array<{ parentBusinessId?: string | null; structureKind?: string | null; tier?: string | null }>;
  isReception?: boolean;
  tenureDays?: number;
}): PersonaKind {
  const { role, businessCount, isReception, businesses } = args;
  if (!role || businessCount === 0) {
    return "owner";
  }
  // "Founder/owner" was confusing — what we actually need is "org-wide /
  // multi-location operator". We treat an OWNER as org admin when they have
  // an explicit multi-location structure signal (chain tier, parent links, or
  // brand entity present), not merely "2 businesses" (consultants can have 2+).
  if (role === "OWNER") {
    const hasHierarchy =
      (businesses ?? []).some((b) => !!b.parentBusinessId) ||
      (businesses ?? []).some((b) => b.structureKind === "brand_entity" || b.structureKind === "location") ||
      (businesses ?? []).some((b) => b.tier === "chain" || b.tier === "mid-chain" || b.tier === "franchise");
    if (hasHierarchy && businessCount >= 2) return "org_admin";
    return "owner";
  }
  if (role === "ADMIN" && isReception) return "receptionist";
  if (role === "ADMIN") return "manager";
  if (role === "STAFF") return "staff";
  return "owner";
}

export function usePersona(): {
  kind: PersonaKind;
  override: PersonaKind | null;
  isLoading: boolean;
} {
  const { role, isReception, tenureDays: _tenureDays, isLoading: roleLoading } = useMembership();
  const { businesses, isLoading: bizLoading } = useBusiness();
  const [override, setOverride] = useState<PersonaKind | null>(() => getDevPersonaOverride());

  useEffect(() => {
    const handler = (e: Event) => {
      const next = (e as CustomEvent).detail as PersonaKind | null;
      setOverride(next ?? null);
    };
    const storageHandler = (e: StorageEvent) => {
      if (e.key === LS_KEY) setOverride(normalizeStoredPersona(e.newValue));
    };
    window.addEventListener("livia:devPersonaChange", handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("livia:devPersonaChange", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const auto = deriveAutoPersona({
    role,
    businessCount: businesses.length,
    businesses: businesses as unknown as Array<{
      parentBusinessId?: string | null;
      structureKind?: string | null;
      tier?: string | null;
    }>,
    isReception,
    tenureDays: _tenureDays,
  });
  return {
    kind: auto,
    override: null,
    isLoading: roleLoading || bizLoading,
  };
}

export const PERSONA_LANDING: Record<PersonaKind, string> = {
  org_admin: "/chain",
  owner: "/dashboard",
  manager: "/inbox",
  staff: "/my-day",
  receptionist: "/bookings",
};
