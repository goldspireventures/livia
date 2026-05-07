import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useMembership } from "@/hooks/useMembership";

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

const DEV_OVERRIDE_KEY = "livia.devPersona";

export const isDemoLoginEnabled =
  process.env.EXPO_PUBLIC_DEMO_LOGIN === "true" ||
  process.env.NODE_ENV !== "production";

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
  const v = (await AsyncStorage.getItem(DEV_OVERRIDE_KEY)) as PersonaKind | null;
  cachedOverride = v ?? null;
  return cachedOverride;
}

export function deriveAutoPersona(args: {
  role: "OWNER" | "ADMIN" | "STAFF" | null;
  businessCount: number;
  isReception?: boolean;
  tenureDays?: number;
  utilisation14?: number;
}): PersonaKind {
  const { role, businessCount, isReception, tenureDays = 0, utilisation14 = 0 } = args;
  if (!role || businessCount === 0) return "customer";
  if (role === "OWNER" && businessCount >= 2) return "founder";
  if (role === "OWNER") return "owner";
  if (role === "ADMIN" && isReception) return "receptionist";
  if (role === "ADMIN") return "manager";
  if (tenureDays > 365 && utilisation14 > 0.7) return "staff-senior";
  return "staff-junior";
}

export function usePersona(): {
  kind: PersonaKind;
  override: PersonaKind | null;
  isLoading: boolean;
} {
  const { role, isLoading: roleLoading } = useMembership();
  const { businesses, isLoading: bizLoading } = useBusiness();
  const [override, setOverride] = useState<PersonaKind | null>(cachedOverride);
  const [hydrated, setHydrated] = useState(cachedOverride !== null);

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

  const auto = deriveAutoPersona({
    role,
    businessCount: businesses.length,
  });

  return {
    kind: isDemoLoginEnabled && override ? override : auto,
    override: isDemoLoginEnabled ? override : null,
    isLoading: roleLoading || bizLoading || !hydrated,
  };
}
