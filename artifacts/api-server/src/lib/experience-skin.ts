import type { BusinessVertical } from "@workspace/policy";
import { resolveJurisdictionCode } from "@workspace/policy";

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

/** Demo service card images — stable Unsplash IDs by keyword. */
const SERVICE_IMAGES: Record<string, string> = {
  colour: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
  color: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
  cut: "https://images.unsplash.com/photo-1503956546970-5a150ba5a4?w=400&h=300&fit=crop",
  fade: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop",
  beard: "https://images.unsplash.com/photo-1599351431202-1e0f0137892a?w=400&h=300&fit=crop",
  lash: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
  nail: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop",
  brow: "https://images.unsplash.com/photo-1487412940907-6530b50e3063?w=400&h=300&fit=crop",
  massage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
  tattoo: "https://images.unsplash.com/photo-1598371839696-5c5bb00bc9bc?w=400&h=300&fit=crop",
  consult: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop",
  botox: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=300&fit=crop",
  filler: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop",
  groom: "https://images.unsplash.com/photo-1516734212186-a967f81ad12d?w=400&h=300&fit=crop",
  dog: "https://images.unsplash.com/photo-1516734212186-a967f81ad12d?w=400&h=300&fit=crop",
  detail: "https://images.unsplash.com/photo-1601362841437-42e164e303e7?w=400&h=300&fit=crop",
  fitness: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
  physio: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop",
};

const VERTICAL_FALLBACK: Record<BusinessVertical, string> = {
  hair: SERVICE_IMAGES.cut!,
  beauty: SERVICE_IMAGES.lash!,
  "body-art": SERVICE_IMAGES.tattoo!,
  wellness: SERVICE_IMAGES.massage!,
  fitness: SERVICE_IMAGES.fitness!,
  medspa: SERVICE_IMAGES.consult!,
  "allied-health": SERVICE_IMAGES.physio!,
  "pet-grooming": SERVICE_IMAGES.groom!,
  "automotive-detailing": SERVICE_IMAGES.detail!,
};

export function inferDemoServiceImageUrl(
  serviceName: string,
  vertical?: BusinessVertical | null,
): string | undefined {
  const n = serviceName.toLowerCase();
  for (const [key, url] of Object.entries(SERVICE_IMAGES)) {
    if (n.includes(key)) return url;
  }
  if (vertical && VERTICAL_FALLBACK[vertical]) return VERTICAL_FALLBACK[vertical];
  return undefined;
}
