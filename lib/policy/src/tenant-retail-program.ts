/**
 * Tenant mini-store — vertical retail packs for /b guest bag + owner catalogue.
 * Not full POS; curated SKUs, Stripe pay links, Liv post-session attach.
 *
 * Owner configures catalog facts; Liv matches SKUs to completed treatments (see resolveRetailProductForService).
 */
import type { BusinessVertical } from "./types";
import { getSubverticalProfile } from "./subvertical-profiles";
import { resolveAftercareMessageBody } from "./guest-care-automation";

export type TenantRetailStoreSettings = {
  enabled: boolean;
  title: string;
  postSessionSuggest: boolean;
};

export type TenantRetailProductTemplate = {
  name: string;
  description?: string;
  priceMinor: number;
  currency: string;
  sku?: string;
  category: string;
  /** Treatment category Liv matches after session (e.g. Lashes → lash cleanser). */
  linkedServiceCategory?: string;
  sortOrder?: number;
  imageUrl?: string | null;
};

export type RetailProductMatchInput = {
  id?: string;
  name: string;
  category?: string | null;
  linkedServiceCategory?: string | null;
  isActive?: boolean;
};

export type TenantRetailPack = {
  vertical: BusinessVertical;
  ownerTitle: string;
  ownerSubtitle: string;
  defaultPublicTitle: string;
  templateSeedLabel: string;
  attachTitle: string;
  attachDescription: string;
  categories: readonly string[];
  templates: readonly TenantRetailProductTemplate[];
  /** Hair barbershop sub-profile overrides templates + categories. */
  barber?: {
    categories: readonly string[];
    templates: readonly TenantRetailProductTemplate[];
    defaultPublicTitle: string;
    attachTitle: string;
  };
};

export const TENANT_RETAIL_PROGRAM = {
  maxActiveProducts: 12,
  publicMaxVisible: 6,
  defaultTitle: "Take home",
  inventoryHint: "Set starting stock per product — Liv tracks sold count as guests pay.",
  maxCartLines: 8,
  maxQtyPerLine: 5,
} as const;

export type RetailCartItemInput = { productId: string; quantity?: number };

export function normalizeRetailCartItems(
  items: RetailCartItemInput[],
): { productId: string; quantity: number }[] {
  const merged = new Map<string, number>();
  for (const raw of items) {
    const id = String(raw.productId ?? "").trim();
    if (!id) continue;
    const qty = Math.max(
      1,
      Math.min(TENANT_RETAIL_PROGRAM.maxQtyPerLine, Math.floor(raw.quantity ?? 1)),
    );
    merged.set(id, Math.min(TENANT_RETAIL_PROGRAM.maxQtyPerLine, (merged.get(id) ?? 0) + qty));
  }
  return [...merged.entries()]
    .slice(0, TENANT_RETAIL_PROGRAM.maxCartLines)
    .map(([productId, quantity]) => ({ productId, quantity }));
}

const HAIR_SALON_TEMPLATES: TenantRetailProductTemplate[] = [
  {
    name: "18\" human hair bundle",
    description: "Virgin hair · 100g — colour-match at the chair",
    priceMinor: 14500,
    currency: "EUR",
    sku: "HR-BND-18",
    category: "Bundles",
    sortOrder: 1,
  },
  {
    name: "Lace front wig",
    description: "Pre-plucked hairline · 14\" — install add-on available",
    priceMinor: 22000,
    currency: "EUR",
    sku: "HR-WIG-LF14",
    category: "Wigs & extensions",
    sortOrder: 2,
  },
  {
    name: "Colour-safe shampoo",
    description: "300ml · sulphate-free — extends toner life",
    priceMinor: 2400,
    currency: "EUR",
    sku: "HR-SHAM-300",
    category: "Home care",
    sortOrder: 3,
  },
  {
    name: "Heat protectant spray",
    description: "200ml · blow-dry and flat iron shield",
    priceMinor: 1800,
    currency: "EUR",
    sku: "HR-HEAT-200",
    category: "Home care",
    sortOrder: 4,
  },
  {
    name: "Silk bonnet set",
    description: "Bonnet + scrunchie — overnight style protection",
    priceMinor: 2200,
    currency: "EUR",
    sku: "HR-BONNET",
    category: "Gift sets",
    sortOrder: 5,
  },
  {
    name: "Retail colour tube",
    description: "Take-home refresh between salon visits",
    priceMinor: 1600,
    currency: "EUR",
    sku: "HR-COL-TUBE",
    category: "Colour retail",
    sortOrder: 6,
  },
];

const HAIR_BARBER_TEMPLATES: TenantRetailProductTemplate[] = [
  {
    name: "Pro clipper set",
    description: "Cordless · fade-ready — staff pick",
    priceMinor: 18900,
    currency: "EUR",
    sku: "BB-CLIP-PRO",
    category: "Clippers & tools",
    sortOrder: 1,
  },
  {
    name: "Beard grooming kit",
    description: "Comb, oil, balm — gift-ready tin",
    priceMinor: 4500,
    currency: "EUR",
    sku: "BB-KIT-BEARD",
    category: "Grooming kits",
    sortOrder: 2,
  },
  {
    name: "Beard oil",
    description: "30ml · cedar + bergamot",
    priceMinor: 1600,
    currency: "EUR",
    sku: "BB-OIL-30",
    category: "Beard care",
    sortOrder: 3,
  },
  {
    name: "Styling pomade",
    description: "High hold · matte finish",
    priceMinor: 1400,
    currency: "EUR",
    sku: "BB-POMADE",
    category: "Beard care",
    sortOrder: 4,
  },
  {
    name: "Hot towel kit",
    description: "Towels + pre-shave oil — take the ritual home",
    priceMinor: 3200,
    currency: "EUR",
    sku: "BB-HOT-TOWEL",
    category: "Grooming kits",
    sortOrder: 5,
  },
  {
    name: "Shop tee",
    description: "Barbershop merch · unisex fit",
    priceMinor: 2800,
    currency: "EUR",
    sku: "BB-TEE",
    category: "Merch",
    sortOrder: 6,
  },
];

const BEAUTY_TEMPLATES: TenantRetailProductTemplate[] = [
  {
    name: "Lash cleanser",
    description: "150ml · daily foam cleanse — extends fill life",
    priceMinor: 1800,
    currency: "EUR",
    sku: "BB-LASH-CLEAN",
    category: "Aftercare",
    linkedServiceCategory: "Lashes",
    sortOrder: 1,
  },
  {
    name: "Cuticle oil pen",
    description: "On-the-go nail care after gel manicure",
    priceMinor: 1200,
    currency: "EUR",
    sku: "BB-CUT-OIL",
    category: "Nails",
    linkedServiceCategory: "Nails",
    sortOrder: 2,
  },
  {
    name: "Brow growth serum",
    description: "4ml · pairs with lamination + tint",
    priceMinor: 3200,
    currency: "EUR",
    sku: "BB-BROW-SERUM",
    category: "Brows",
    linkedServiceCategory: "Brows",
    sortOrder: 3,
  },
  {
    name: "Aftercare trio",
    description: "Lash + brow + nail mini set — gift attach",
    priceMinor: 4500,
    currency: "EUR",
    sku: "BB-TRIO",
    category: "Gift sets",
    sortOrder: 4,
  },
  {
    name: "Lash sealant",
    description: "Clear coat — extends fill life between visits",
    priceMinor: 2200,
    currency: "EUR",
    sku: "BB-LASH-SEAL",
    category: "Lashes",
    linkedServiceCategory: "Lashes",
    sortOrder: 5,
  },
  {
    name: "Brow lamination kit",
    description: "Home care between studio lamination visits",
    priceMinor: 2800,
    currency: "EUR",
    sku: "BB-BROW-KIT",
    category: "Brows",
    linkedServiceCategory: "Brows",
    sortOrder: 6,
  },
];

const WELLNESS_TEMPLATES: TenantRetailProductTemplate[] = [
  {
    name: "Harbour Calm body oil",
    description: "60ml · lavender + cedar — take-home after massage",
    priceMinor: 2800,
    currency: "EUR",
    sku: "HC-OIL-60",
    category: "Ritual",
    sortOrder: 1,
  },
  {
    name: "Stillness recovery balm",
    description: "100ml · muscle ease — pairs with deep tissue",
    priceMinor: 2200,
    currency: "EUR",
    sku: "ST-BALM-100",
    category: "Ritual",
    sortOrder: 2,
  },
  {
    name: "Garden hydration mist",
    description: "50ml · post-float or sauna ritual",
    priceMinor: 1800,
    currency: "EUR",
    sku: "GD-MIST-50",
    category: "Ritual",
    sortOrder: 3,
  },
  {
    name: "Harbour gift trio",
    description: "Oil + balm + mist — voucher attach at reception",
    priceMinor: 6500,
    currency: "EUR",
    sku: "HC-GIFT-TRIO",
    category: "Gift sets",
    sortOrder: 4,
  },
];

const BODY_ART_TEMPLATES: TenantRetailProductTemplate[] = [
  {
    name: "Tattoo aftercare balm",
    description: "50g · fragrance-free healing balm",
    priceMinor: 1800,
    currency: "EUR",
    sku: "INK-BALM-50",
    category: "Aftercare",
    sortOrder: 1,
  },
  {
    name: "Saline spray",
    description: "100ml · piercing and fresh tattoo rinse",
    priceMinor: 1200,
    currency: "EUR",
    sku: "INK-SALINE",
    category: "Aftercare",
    sortOrder: 2,
  },
  {
    name: "Titanium stud upgrade",
    description: "Implant-grade · single piece",
    priceMinor: 3500,
    currency: "EUR",
    sku: "INK-STUD-TI",
    category: "Jewellery",
    sortOrder: 3,
  },
  {
    name: "Aftercare bundle",
    description: "Balm + saline + instructions card",
    priceMinor: 2800,
    currency: "EUR",
    sku: "INK-KIT",
    category: "Gift sets",
    sortOrder: 4,
  },
];

const MEDSPA_TEMPLATES: TenantRetailProductTemplate[] = [
  {
    name: "SPF 50 daily moisturiser",
    description: "50ml · post-treatment sun protection",
    priceMinor: 4200,
    currency: "EUR",
    sku: "MS-SPF50",
    category: "Skincare",
    sortOrder: 1,
  },
  {
    name: "Gentle cleanser",
    description: "200ml · clinic-grade — home between visits",
    priceMinor: 3800,
    currency: "EUR",
    sku: "MS-CLEANSE",
    category: "Skincare",
    sortOrder: 2,
  },
  {
    name: "Recovery balm",
    description: "Post-injectable soothing — ask your practitioner",
    priceMinor: 3200,
    currency: "EUR",
    sku: "MS-RECOV",
    category: "Home care",
    sortOrder: 3,
  },
];

const FITNESS_TEMPLATES: TenantRetailProductTemplate[] = [
  {
    name: "Studio tee",
    description: "Breathable cotton · unisex sizes",
    priceMinor: 2800,
    currency: "EUR",
    sku: "FT-TEE",
    category: "Merch",
    sortOrder: 1,
  },
  {
    name: "Resistance band set",
    description: "Light / medium / heavy — home mobility",
    priceMinor: 2400,
    currency: "EUR",
    sku: "FT-BANDS",
    category: "Recovery",
    sortOrder: 2,
  },
  {
    name: "Foam roller",
    description: "45cm · post-class recovery",
    priceMinor: 3500,
    currency: "EUR",
    sku: "FT-ROLLER",
    category: "Recovery",
    sortOrder: 3,
  },
];

const ALLIED_HEALTH_TEMPLATES: TenantRetailProductTemplate[] = [
  {
    name: "Resistance band set",
    description: "Home exercise programme support",
    priceMinor: 2200,
    currency: "EUR",
    sku: "AH-BANDS",
    category: "Support",
    sortOrder: 1,
  },
  {
    name: "Foam roller",
    description: "Self-myofascial release between sessions",
    priceMinor: 3200,
    currency: "EUR",
    sku: "AH-ROLLER",
    category: "Support",
    sortOrder: 2,
  },
  {
    name: "Posture cushion",
    description: "Lumbar support for desk days",
    priceMinor: 4500,
    currency: "EUR",
    sku: "AH-CUSHION",
    category: "Support",
    sortOrder: 3,
  },
];

const PET_TEMPLATES: TenantRetailProductTemplate[] = [
  {
    name: "Hypoallergenic shampoo",
    description: "250ml · sensitive coat formula",
    priceMinor: 1600,
    currency: "EUR",
    sku: "PET-SHAM",
    category: "Grooming",
    sortOrder: 1,
  },
  {
    name: "Paw balm",
    description: "Seasonal paw protection",
    priceMinor: 1200,
    currency: "EUR",
    sku: "PET-PAW",
    category: "Grooming",
    sortOrder: 2,
  },
  {
    name: "Dental chews (small pack)",
    description: "Daily dental support treat",
    priceMinor: 900,
    currency: "EUR",
    sku: "PET-CHEW",
    category: "Treats",
    sortOrder: 3,
  },
];

const AUTO_TEMPLATES: TenantRetailProductTemplate[] = [
  {
    name: "Interior detail spray",
    description: "500ml · matte dash safe",
    priceMinor: 1800,
    currency: "EUR",
    sku: "AD-INT-SPR",
    category: "Care",
    sortOrder: 1,
  },
  {
    name: "Ceramic maintenance kit",
    description: "Wash + topper — extends coating life",
    priceMinor: 4500,
    currency: "EUR",
    sku: "AD-CER-KIT",
    category: "Care",
    sortOrder: 2,
  },
  {
    name: "Microfiber set",
    description: "3-pack · paint-safe",
    priceMinor: 2200,
    currency: "EUR",
    sku: "AD-MF-3",
    category: "Tools",
    sortOrder: 3,
  },
];

const TENANT_RETAIL_PACKS: Record<Exclude<BusinessVertical, "event-vendors">, TenantRetailPack> = {
  hair: {
    vertical: "hair",
    ownerTitle: "Shop & take-home",
    ownerSubtitle:
      "Bundles, wigs, and home care on your /b page — Liv can text a pay link after visits.",
    defaultPublicTitle: "Take home",
    templateSeedLabel: "Load salon retail templates",
    attachTitle: "Take-home — shop",
    attachDescription: "Generate a pay link to text after the appointment.",
    categories: ["Bundles", "Wigs & extensions", "Home care", "Colour retail", "Gift sets", "Other"],
    templates: HAIR_SALON_TEMPLATES,
    barber: {
      categories: ["Clippers & tools", "Grooming kits", "Beard care", "Merch", "Other"],
      templates: HAIR_BARBER_TEMPLATES,
      defaultPublicTitle: "Shop",
      attachTitle: "Shop — grooming retail",
    },
  },
  beauty: {
    vertical: "beauty",
    ownerTitle: "Mini store",
    ownerSubtitle:
      "Aftercare and take-home products on your /b page — Liv can text a pay link after sessions.",
    defaultPublicTitle: "Take home",
    templateSeedLabel: "Load aftercare templates",
    attachTitle: "Aftercare — mini store",
    attachDescription: "Generate a pay link to text after the session.",
    categories: ["Aftercare", "Lashes", "Nails", "Brows", "Gift sets", "Other"],
    templates: BEAUTY_TEMPLATES,
  },
  wellness: {
    vertical: "wellness",
    ownerTitle: "Post-session retail",
    ownerSubtitle:
      "Oils, balms, and gift sets on your /b page — calm inbox thread after checkout.",
    defaultPublicTitle: "Take the ritual home",
    templateSeedLabel: "Load ritual templates",
    attachTitle: "Ritual at home",
    attachDescription: "Generate a pay link or mention products at reception.",
    categories: ["Ritual", "Gift sets", "Other"],
    templates: WELLNESS_TEMPLATES,
  },
  "body-art": {
    vertical: "body-art",
    ownerTitle: "Aftercare shop",
    ownerSubtitle: "Healing products and jewellery on your /b page — pay link after sessions.",
    defaultPublicTitle: "Aftercare",
    templateSeedLabel: "Load aftercare templates",
    attachTitle: "Aftercare products",
    attachDescription: "Send a pay link for balm, saline, or jewellery.",
    categories: ["Aftercare", "Jewellery", "Gift sets", "Other"],
    templates: BODY_ART_TEMPLATES,
  },
  medspa: {
    vertical: "medspa",
    ownerTitle: "Retail skincare",
    ownerSubtitle: "Clinic-grade home care on your /b page — practitioner-approved only.",
    defaultPublicTitle: "Home care",
    templateSeedLabel: "Load skincare templates",
    attachTitle: "Home care retail",
    attachDescription: "Pay link for post-treatment products.",
    categories: ["Skincare", "Home care", "Other"],
    templates: MEDSPA_TEMPLATES,
  },
  fitness: {
    vertical: "fitness",
    ownerTitle: "Studio shop",
    ownerSubtitle: "Merch and recovery gear on your /b page — sell without a separate store.",
    defaultPublicTitle: "Studio shop",
    templateSeedLabel: "Load studio shop templates",
    attachTitle: "Studio shop",
    attachDescription: "Pay link for merch or recovery gear.",
    categories: ["Merch", "Recovery", "Other"],
    templates: FITNESS_TEMPLATES,
  },
  "allied-health": {
    vertical: "allied-health",
    ownerTitle: "Support products",
    ownerSubtitle: "Bands, rollers, and supports on your /b page — between-session continuity.",
    defaultPublicTitle: "Take home",
    templateSeedLabel: "Load support product templates",
    attachTitle: "Support products",
    attachDescription: "Pay link for home exercise support items.",
    categories: ["Support", "Other"],
    templates: ALLIED_HEALTH_TEMPLATES,
  },
  "pet-grooming": {
    vertical: "pet-grooming",
    ownerTitle: "Pet retail",
    ownerSubtitle: "Shampoo, treats, and grooming extras on your /b page.",
    defaultPublicTitle: "Pet extras",
    templateSeedLabel: "Load pet retail templates",
    attachTitle: "Pet retail",
    attachDescription: "Pay link for take-home grooming products.",
    categories: ["Grooming", "Treats", "Other"],
    templates: PET_TEMPLATES,
  },
  "automotive-detailing": {
    vertical: "automotive-detailing",
    ownerTitle: "Detailing products",
    ownerSubtitle: "Care kits and tools on your /b page — extend the detail at home.",
    defaultPublicTitle: "Care products",
    templateSeedLabel: "Load care product templates",
    attachTitle: "Care products",
    attachDescription: "Pay link for maintenance kits.",
    categories: ["Care", "Tools", "Other"],
    templates: AUTO_TEMPLATES,
  },
};

/** Appointment verticals with guest cart on /b — event-vendors use quote catalogue instead. */
export const PUBLIC_RETAIL_VERTICALS = Object.keys(TENANT_RETAIL_PACKS) as Exclude<
  BusinessVertical,
  "event-vendors"
>[];

export function verticalSupportsRetail(vertical: string | null | undefined): boolean {
  return (PUBLIC_RETAIL_VERTICALS as readonly string[]).includes(vertical ?? "");
}

export function isPublicRetailVertical(vertical: string | null | undefined): boolean {
  return verticalSupportsRetail(vertical);
}

export function tenantRetailOwnerRoute(): "/store" {
  return "/store";
}

function isBarberHairProfile(subverticalProfileId?: string | null): boolean {
  if (!subverticalProfileId) return false;
  const profile = getSubverticalProfile(subverticalProfileId);
  return profile?.id === "hair.barber";
}

export function resolveTenantRetailPack(
  vertical: BusinessVertical | string | null | undefined,
  subverticalProfileId?: string | null,
): TenantRetailPack | null {
  if (!verticalSupportsRetail(vertical)) return null;
  const pack = TENANT_RETAIL_PACKS[vertical as keyof typeof TENANT_RETAIL_PACKS];
  if (!pack) return null;
  if (vertical === "hair" && isBarberHairProfile(subverticalProfileId) && pack.barber) {
    return {
      ...pack,
      defaultPublicTitle: pack.barber.defaultPublicTitle,
      attachTitle: pack.barber.attachTitle,
      categories: pack.barber.categories,
      templates: pack.barber.templates,
      templateSeedLabel: "Load barber shop templates",
      ownerSubtitle:
        "Clippers, kits, and grooming products on your /b page — Liv texts a pay link after cuts.",
    };
  }
  return pack;
}

export function tenantRetailTemplatesForBusiness(
  vertical: BusinessVertical | string | null | undefined,
  subverticalProfileId?: string | null,
): readonly TenantRetailProductTemplate[] {
  return resolveTenantRetailPack(vertical, subverticalProfileId)?.templates ?? [];
}

export function defaultTenantRetailStoreSettings(
  vertical?: BusinessVertical | string | null,
): TenantRetailStoreSettings {
  const title =
    resolveTenantRetailPack(vertical)?.defaultPublicTitle ?? TENANT_RETAIL_PROGRAM.defaultTitle;
  return {
    enabled: false,
    title,
    postSessionSuggest: true,
  };
}

export function parseTenantRetailStoreSettings(raw: unknown): TenantRetailStoreSettings {
  const base = defaultTenantRetailStoreSettings();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const legacyHidden = o.showOnPublicBook === false;
  return {
    enabled: o.enabled === true && !legacyHidden,
    title: typeof o.title === "string" && o.title.trim() ? o.title.trim() : base.title,
    postSessionSuggest: o.postSessionSuggest !== false,
  };
}

export function isTenantRetailVisibleOnPublicBook(
  settings: TenantRetailStoreSettings,
  activeProductCount: number,
): boolean {
  return settings.enabled && activeProductCount > 0;
}

export function isRetailProductInStock(stockQuantity?: number | null): boolean {
  return stockQuantity == null || stockQuantity > 0;
}

export function formatRetailInventoryLabel(product: {
  stockQuantity?: number | null;
  soldQuantity?: number | null;
}): string | null {
  const sold = product.soldQuantity ?? 0;
  const stock = product.stockQuantity;
  const parts: string[] = [];
  if (sold > 0) parts.push(`${sold} sold`);
  if (stock != null) parts.push(`${Math.max(0, stock)} in stock`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function buildTenantRetailPaySms(args: {
  businessName: string;
  productName: string;
  payUrl: string;
  guestFirstName?: string | null;
}): string {
  const hi = args.guestFirstName?.trim() ? `Hi ${args.guestFirstName.trim()}, ` : "";
  return `${hi}${args.businessName}: take ${args.productName} home — pay in two taps: ${args.payUrl}`;
}

function normalizeServiceCategory(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

/** Liv/platform matcher — owner stocks SKUs; Liv picks one relevant product for the visit. */
export function resolveRetailProductForService(args: {
  products: RetailProductMatchInput[];
  serviceCategory?: string | null;
  linkedProductId?: string | null;
}): RetailProductMatchInput | null {
  const active = args.products.filter((p) => p.isActive !== false);
  if (active.length === 0) return null;

  if (args.linkedProductId) {
    const linked = active.find((p) => p.id === args.linkedProductId);
    if (linked) return linked;
  }

  const cat = normalizeServiceCategory(args.serviceCategory);
  if (!cat) return null;

  const byLink = active.find((p) => normalizeServiceCategory(p.linkedServiceCategory) === cat);
  if (byLink) return byLink;

  const byCategory = active.find((p) => normalizeServiceCategory(p.category) === cat);
  if (byCategory) return byCategory;

  if (cat.includes("lash")) {
    return active.find((p) => /lash/i.test(p.name)) ?? null;
  }
  if (cat.includes("brow")) {
    return active.find((p) => /brow/i.test(p.name)) ?? null;
  }
  if (cat.includes("nail")) {
    return active.find((p) => /cuticle|nail/i.test(p.name)) ?? null;
  }

  return null;
}

/** Example draft for owner UI — not the live message (Liv builds from real booking context). */
export function buildPostSessionLivPreview(args: {
  vertical: BusinessVertical | string | null | undefined;
  businessName: string;
  serviceName: string;
  serviceCategory?: string | null;
  products?: RetailProductMatchInput[];
}): { body: string; matchedProduct: string | null; caption: string } {
  const matched = resolveRetailProductForService({
    products: args.products ?? [],
    serviceCategory: args.serviceCategory,
  });
  const body = resolveAftercareMessageBody({
    vertical: (args.vertical ?? "beauty") as BusinessVertical,
    businessName: args.businessName,
    serviceName: args.serviceName,
    serviceCategory: args.serviceCategory,
    retailProductName: matched?.name ?? null,
  });
  return {
    body,
    matchedProduct: matched?.name ?? null,
    caption: `Example after ${args.serviceName} — Liv adapts to each guest and your send mode in Settings.`,
  };
}

export function buildTenantPostSessionInboxDraft(
  vertical: BusinessVertical | string | null | undefined,
  options?: {
    guestFirstName?: string;
    productName?: string;
    payUrl?: string;
  },
): { body: string; steps: string[] } {
  const pack = resolveTenantRetailPack(vertical);
  const greeting = options?.guestFirstName ? `Hi ${options.guestFirstName},\n\n` : "";
  const product =
    options?.productName && options?.payUrl
      ? `\n\nIf you'd like it at home, ${options.productName} is one tap away: ${options.payUrl}`
      : options?.productName
        ? `\n\nWe also have ${options.productName} at reception if you'd like to grab it before you go.`
        : "";
  const thanks =
    vertical === "wellness"
      ? "Thanks for today's session — take the calm home with you."
      : vertical === "hair"
        ? "Thanks for visiting today — your stylist shared home-care tips."
        : vertical === "body-art"
          ? "Thanks for sitting today — follow the aftercare your artist shared."
          : "Thanks for visiting today — follow the care guidance your team shared.";
  const body = `${greeting}${thanks}${product}\n\nReply here if you have any questions.`;
  return {
    body,
    steps: [
      "Open the guest thread from today's completed visit.",
      `Edit the draft — add or swap a product from your ${pack?.ownerTitle.toLowerCase() ?? "shop"}.`,
      "Send when ready; guest pays via the link on /b if Stripe is connected.",
    ],
  };
}
