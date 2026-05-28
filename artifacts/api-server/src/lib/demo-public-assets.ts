import type { BusinessVertical } from "@workspace/policy";
import { updateBusiness } from "../services/businesses.service";

/** Stable Unsplash URLs for demo public pages — no API keys, CDN-hosted. */
const ASSETS: Partial<
  Record<
    BusinessVertical,
    { coverImageUrl: string; logoUrl: string; instagramHandle: string }
  >
> = {
  hair: {
    coverImageUrl:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=200&h=200&fit=crop",
    instagramHandle: "aurorastudio.dublin",
  },
  beauty: {
    coverImageUrl:
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1487412940907-6530b50e3063?w=200&h=200&fit=crop",
    instagramHandle: "bloombeauty.dublin",
  },
  wellness: {
    coverImageUrl:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&h=200&fit=crop",
    instagramHandle: "harbourwellness",
  },
  "body-art": {
    coverImageUrl:
      "https://images.unsplash.com/photo-1598371839696-5c5bb00bc9bc?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1611501275019-9b5cda994e08?w=200&h=200&fit=crop",
    instagramHandle: "inkanchorgalway",
  },
  "pet-grooming": {
    coverImageUrl:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad12d?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop",
    instagramHandle: "pawsparlour",
  },
  medspa: {
    coverImageUrl:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=200&h=200&fit=crop",
    instagramHandle: "claritymedspa",
  },
  "allied-health": {
    coverImageUrl:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1631217868264-e5b964bb3e93?w=200&h=200&fit=crop",
    instagramHandle: "motionphysio",
  },
  "automotive-detailing": {
    coverImageUrl:
      "https://images.unsplash.com/photo-1601362841437-42e164e303e7?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1619642751034-765df6387c12?w=200&h=200&fit=crop",
    instagramHandle: "shinestudiobelfast",
  },
  fitness: {
    coverImageUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop",
    instagramHandle: "peakfitnessdublin",
  },
};

export async function applyDemoPublicBranding(
  businessId: string,
  vertical: BusinessVertical,
  overrides?: { instagramHandle?: string },
) {
  const pack = ASSETS[vertical];
  if (!pack) return;
  await updateBusiness(businessId, {
    coverImageUrl: pack.coverImageUrl,
    logoUrl: pack.logoUrl,
    instagramHandle: overrides?.instagramHandle ?? pack.instagramHandle,
  });
}
