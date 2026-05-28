import { getApiBaseUrl } from "@/lib/api-base";
import {
  ONBOARDING_JURISDICTIONS,
  ONBOARDING_TIERS,
  ONBOARDING_VERTICALS,
} from "@/constants/onboarding";

export type OnboardingCatalogJurisdiction = {
  jurisdiction: string;
  label: string;
  defaultTimezone: string;
};

export type OnboardingCatalogVertical = {
  vertical: string;
  label: string;
  categoryAliases?: string[];
};

export type OnboardingCatalog = {
  jurisdictions: OnboardingCatalogJurisdiction[];
  verticals: OnboardingCatalogVertical[];
  tiers: string[];
};

const TIER_HINTS: Record<string, string> = {
  solo: "Just you on the chair",
  studio: "Team + manager",
  chain: "Multi-location",
  "chair-host": "Host independent practitioners",
  "white-label": "Multi-brand portfolio",
};

export function tierOptionsFromCatalog(tiers: string[]) {
  return tiers.map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " "),
    hint: TIER_HINTS[value] ?? "",
  }));
}

function offlineCatalog(): OnboardingCatalog {
  return {
    jurisdictions: ONBOARDING_JURISDICTIONS.map((j) => ({
      jurisdiction: j.code,
      label: j.label,
      defaultTimezone:
        j.code === "GB"
          ? "Europe/London"
          : j.code === "DE"
            ? "Europe/Berlin"
            : "Europe/Dublin",
    })),
    verticals: ONBOARDING_VERTICALS.map((v) => ({
      vertical: v.value,
      label: v.label,
    })),
    tiers: ONBOARDING_TIERS.map((t) => t.value),
  };
}

/** Policy catalog from API — offline fallback only when network/auth fails. */
export async function fetchOnboardingCatalog(
  getToken: () => Promise<string | null>,
): Promise<OnboardingCatalog> {
  const token = await getToken();
  if (!token) return offlineCatalog();

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/onboarding/catalog`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return offlineCatalog();
    const body = (await res.json()) as OnboardingCatalog;
    if (!body.verticals?.length || !body.jurisdictions?.length) return offlineCatalog();
    return body;
  } catch {
    return offlineCatalog();
  }
}
