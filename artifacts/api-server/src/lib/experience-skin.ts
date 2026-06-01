import type { BusinessVertical } from "@workspace/policy";
import {
  inferPublicServiceImageFromName,
  PUBLIC_SERVICE_IMAGE_KEYWORDS,
  resolveJurisdictionCode,
} from "@workspace/policy";

const SHELL: Record<BusinessVertical, string> = {
  hair: "warm",
  beauty: "soft",
  "body-art": "bold",
  wellness: "soft",
  fitness: "bold",
  medspa: "clinical",
  "allied-health": "clinical",
  "pet-grooming": "playful",
  "automotive-detailing": "industrial",
};

const DISPLAY: Record<BusinessVertical, "serif" | "sans"> = {
  hair: "serif",
  beauty: "serif",
  "body-art": "sans",
  wellness: "serif",
  fitness: "sans",
  medspa: "sans",
  "allied-health": "sans",
  "pet-grooming": "sans",
  "automotive-detailing": "sans",
};

export function publicExperienceSkin(vertical?: string | null, country?: string | null) {
  const v = (vertical ?? "hair") as BusinessVertical;
  return {
    shell: SHELL[v] ?? "warm",
    display: DISPLAY[v] ?? "serif",
    market: resolveJurisdictionCode(country).toLowerCase(),
  };
}

const VERTICAL_FALLBACK: Record<BusinessVertical, string> = {
  hair: PUBLIC_SERVICE_IMAGE_KEYWORDS.cut!,
  beauty: PUBLIC_SERVICE_IMAGE_KEYWORDS.lash!,
  "body-art": PUBLIC_SERVICE_IMAGE_KEYWORDS.tattoo!,
  wellness: PUBLIC_SERVICE_IMAGE_KEYWORDS.massage!,
  fitness: PUBLIC_SERVICE_IMAGE_KEYWORDS.fitness!,
  medspa: PUBLIC_SERVICE_IMAGE_KEYWORDS.consult!,
  "allied-health": PUBLIC_SERVICE_IMAGE_KEYWORDS.physio!,
  "pet-grooming": PUBLIC_SERVICE_IMAGE_KEYWORDS.groom!,
  "automotive-detailing": PUBLIC_SERVICE_IMAGE_KEYWORDS.detail!,
};

export function inferDemoServiceImageUrl(
  serviceName: string,
  vertical?: BusinessVertical | null,
): string | undefined {
  if (vertical === "body-art") {
    return PUBLIC_SERVICE_IMAGE_KEYWORDS.tattoo;
  }
  const inferred = inferPublicServiceImageFromName(serviceName);
  if (inferred) return inferred;
  if (vertical && VERTICAL_FALLBACK[vertical]) return VERTICAL_FALLBACK[vertical];
  return undefined;
}
