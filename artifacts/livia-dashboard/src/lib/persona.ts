import { useEffect, useState } from "react";
import { useBusiness } from "./business-context";
import { useMembership, type Role } from "./membership-context";

export type PersonaKind =
  | "founder"
  | "owner"
  | "manager"
  | "staff-senior"
  | "staff-junior"
  | "receptionist"
  | "customer";

export const PERSONA_LABEL: Record<PersonaKind, string> = {
  founder: "Founder · multi-shop owner",
  owner: "Owner · single salon",
  manager: "Manager · approvals",
  "staff-senior": "Senior stylist",
  "staff-junior": "Junior stylist",
  receptionist: "Front desk",
  customer: "Customer",
};

export const PERSONA_ACCENT: Record<PersonaKind, string> = {
  founder: "#d9c39a",
  owner: "#22d3ee",
  manager: "#a78bfa",
  "staff-senior": "#34d399",
  "staff-junior": "#fbbf24",
  receptionist: "#818cf8",
  customer: "#fb7185",
};

export const ALL_PERSONAS: PersonaKind[] = [
  "founder",
  "owner",
  "manager",
  "staff-senior",
  "staff-junior",
  "receptionist",
  "customer",
];

const LS_KEY = "livia.devPersona";

export const isDemoLoginEnabled =
  import.meta.env.VITE_DEMO_LOGIN === "true" || import.meta.env.DEV;

export function getDevPersonaOverride(): PersonaKind | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(LS_KEY) as PersonaKind | null;
  return v ?? null;
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
  isReception?: boolean;
  tenureDays?: number;
}): PersonaKind {
  const { role, businessCount, isReception, tenureDays = 0 } = args;
  if (!role || businessCount === 0) return "customer";
  if (role === "OWNER" && businessCount >= 2) return "founder";
  if (role === "OWNER") return "owner";
  if (role === "ADMIN" && isReception) return "receptionist";
  if (role === "ADMIN") return "manager";
  if (tenureDays > 365) return "staff-senior";
  return "staff-junior";
}

export function usePersona(): {
  kind: PersonaKind;
  override: PersonaKind | null;
  isLoading: boolean;
} {
  const { role, isReception, tenureDays, isLoading: roleLoading } = useMembership();
  const { businesses, isLoading: bizLoading } = useBusiness();
  const [override, setOverride] = useState<PersonaKind | null>(getDevPersonaOverride);

  useEffect(() => {
    const handler = (e: Event) => {
      const next = (e as CustomEvent).detail as PersonaKind | null;
      setOverride(next ?? null);
    };
    const storageHandler = (e: StorageEvent) => {
      if (e.key === LS_KEY) setOverride((e.newValue as PersonaKind | null) ?? null);
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
    isReception,
    tenureDays,
  });
  return {
    kind: isDemoLoginEnabled && override ? override : auto,
    override: isDemoLoginEnabled ? override : null,
    isLoading: roleLoading || bizLoading,
  };
}

export const PERSONA_LANDING: Record<PersonaKind, string> = {
  founder: "/dashboard",
  owner: "/dashboard",
  manager: "/inbox",
  "staff-senior": "/my-day",
  "staff-junior": "/my-day",
  receptionist: "/bookings",
  customer: "/my-day",
};
