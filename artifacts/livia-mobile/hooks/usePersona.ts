import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useMembership } from "@/hooks/useMembership";
import { demoPersonaToMobile, getDemoSession } from "@/lib/demo-session";

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

const DEV_OVERRIDE_KEY = "livia.devPersona";

/** Maps deprecated dev-switcher keys to current persona ids. */
function normalizeStoredPersona(raw: string | null): PersonaKind | null {
  if (!raw) return null;
  if (raw === "staff-senior" || raw === "staff-junior") return "staff";
  if (raw === "customer") return "owner";
  // Legacy internal id (pre org-admin rename)
  if (raw === "founder") return "org_admin";
  if (ALL_PERSONAS.includes(raw as PersonaKind)) return raw as PersonaKind;
  return null;
}

import { isDemoMobileSurface } from "@/lib/production-surface";

/** Demo gateway, demo sign-in, persona override — opt-in via env only. */
export const isDemoLoginEnabled = isDemoMobileSurface();

let cachedOverride: PersonaKind | null = null;
const overrideListeners = new Set<(p: PersonaKind | null) => void>();

function notifyOverride(p: PersonaKind | null) {
  cachedOverride = p;
  overrideListeners.forEach((fn) => fn(p));
}

export async function setDevPersonaOverride(p: PersonaKind | null): Promise<void> {
  if (p) {
    await AsyncStorage.setItem(DEV_OVERRIDE_KEY, p);
  } else {
    await AsyncStorage.removeItem(DEV_OVERRIDE_KEY);
  }
  notifyOverride(p);
}

export async function getDevPersonaOverride(): Promise<PersonaKind | null> {
  if (cachedOverride !== null) return cachedOverride;
  const raw = await AsyncStorage.getItem(DEV_OVERRIDE_KEY);
  const v = normalizeStoredPersona(raw);
  if (raw && raw !== v && v) {
    await AsyncStorage.setItem(DEV_OVERRIDE_KEY, v);
  }
  cachedOverride = v;
  return v;
}

export function deriveAutoPersona(args: {
  role: "OWNER" | "ADMIN" | "STAFF" | null;
  businessCount: number;
  businesses?: Array<{ parentBusinessId?: string | null; structureKind?: string | null; tier?: string | null }>;
  isReception?: boolean;
  tenureDays?: number;
}): PersonaKind {
  const { role, businessCount, businesses, isReception } = args;
  if (!role || businessCount === 0) {
    return "owner";
  }
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
  const [override, setOverride] = useState<PersonaKind | null>(cachedOverride);
  const [hydrated, setHydrated] = useState(cachedOverride !== null);
  const [demoPersona, setDemoPersona] = useState<PersonaKind | null>(null);

  useEffect(() => {
    let alive = true;
    if (cachedOverride === null) {
      getDevPersonaOverride().then((v) => {
        if (!alive) return;
        setOverride(v);
        setHydrated(true);
      });
    } else {
      setHydrated(true);
    }
    const listener = (v: PersonaKind | null) => setOverride(v);
    overrideListeners.add(listener);
    return () => {
      alive = false;
      overrideListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    getDemoSession().then((s) => {
      if (!alive || !s?.persona) return;
      setDemoPersona(demoPersonaToMobile(s.persona));
    });
    return () => {
      alive = false;
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

  const fromDemo = demoPersona && !override ? demoPersona : null;

  return {
    kind: fromDemo ?? auto,
    override: null,
    isLoading: roleLoading || bizLoading || !hydrated,
  };
}
