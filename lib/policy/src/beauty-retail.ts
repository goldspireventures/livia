/** Beauty mini-store — aftercare retail attach, not full POS inventory. */

export type BeautyRetailStoreSettings = {
  enabled: boolean;
  title: string;
  postSessionSuggest: boolean;
};

export type BeautyRetailProduct = {
  id: string;
  name: string;
  description?: string | null;
  priceMinor: number;
  currency: string;
  sku?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  category?: string | null;
  stockQuantity?: number | null;
  soldQuantity?: number;
};

export const BEAUTY_RETAIL_PROGRAM = {
  title: "Mini store",
  subtitle: "Aftercare and take-home products on your /b page — Liv can text a pay link after sessions.",
  maxActiveProducts: 12,
  publicMaxVisible: 6,
  defaultTitle: "Take home",
  inventoryHint: "Set starting stock per product — Liv tracks sold count as guests pay.",
  /** Guest cart on /b — one checkout for multiple products. */
  maxCartLines: 8,
  maxQtyPerLine: 5,
} as const;

export type RetailCartItemInput = { productId: string; quantity?: number };

/** Merge duplicate SKUs and cap quantity per line. */
export function normalizeRetailCartItems(
  items: RetailCartItemInput[],
): { productId: string; quantity: number }[] {
  const merged = new Map<string, number>();
  for (const raw of items) {
    const id = String(raw.productId ?? "").trim();
    if (!id) continue;
    const qty = Math.max(1, Math.min(BEAUTY_RETAIL_PROGRAM.maxQtyPerLine, Math.floor(raw.quantity ?? 1)));
    merged.set(id, Math.min(BEAUTY_RETAIL_PROGRAM.maxQtyPerLine, (merged.get(id) ?? 0) + qty));
  }
  return [...merged.entries()]
    .slice(0, BEAUTY_RETAIL_PROGRAM.maxCartLines)
    .map(([productId, quantity]) => ({ productId, quantity }));
}

export const BEAUTY_RETAIL_CATEGORIES = ["Aftercare", "Lashes", "Nails", "Brows", "Gift sets", "Other"] as const;

export const BEAUTY_RETAIL_TEMPLATES: Array<
  Omit<BeautyRetailProduct, "id"> & { category: string }
> = [
  {
    name: "Lash cleanser",
    description: "150ml · daily foam cleanse — extends fill life",
    priceMinor: 1800,
    currency: "EUR",
    sku: "BB-LASH-CLEAN",
    category: "Aftercare",
    sortOrder: 1,
  },
  {
    name: "Cuticle oil pen",
    description: "On-the-go nail care after gel manicure",
    priceMinor: 1200,
    currency: "EUR",
    sku: "BB-CUT-OIL",
    category: "Nails",
    sortOrder: 2,
  },
  {
    name: "Brow growth serum",
    description: "4ml · pairs with lamination + tint",
    priceMinor: 3200,
    currency: "EUR",
    sku: "BB-BROW-SERUM",
    category: "Brows",
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
    sortOrder: 5,
  },
  {
    name: "Brow lamination kit",
    description: "Home care between studio lamination visits",
    priceMinor: 2800,
    currency: "EUR",
    sku: "BB-BROW-KIT",
    category: "Brows",
    sortOrder: 6,
  },
];

export function defaultBeautyRetailStoreSettings(): BeautyRetailStoreSettings {
  return {
    enabled: false,
    title: BEAUTY_RETAIL_PROGRAM.defaultTitle,
    postSessionSuggest: true,
  };
}

export function parseBeautyRetailStoreSettings(raw: unknown): BeautyRetailStoreSettings {
  const base = defaultBeautyRetailStoreSettings();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  // Legacy rows may still carry showOnPublicBook — honour it when reading, never write it back.
  const legacyHidden = o.showOnPublicBook === false;
  return {
    enabled: o.enabled === true && !legacyHidden,
    title: typeof o.title === "string" && o.title.trim() ? o.title.trim() : base.title,
    postSessionSuggest: o.postSessionSuggest !== false,
  };
}

/** Guest-visible on /b when store is on and at least one active SKU. */
export function isBeautyRetailVisibleOnPublicBook(
  settings: BeautyRetailStoreSettings,
  activeProductCount: number,
): boolean {
  return settings.enabled && activeProductCount > 0;
}

/** Whether a SKU can be purchased (stock null = unlimited). */
export function isRetailProductInStock(stockQuantity?: number | null): boolean {
  return stockQuantity == null || stockQuantity > 0;
}

/** Compact label for owner product rows, e.g. "8 sold · 3 in stock". */
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

export function buildBeautyRetailPaySms(args: {
  businessName: string;
  productName: string;
  payUrl: string;
  guestFirstName?: string | null;
}): string {
  const hi = args.guestFirstName?.trim() ? `Hi ${args.guestFirstName.trim()}, ` : "";
  return `${hi}${args.businessName}: take ${args.productName} home — pay in two taps: ${args.payUrl}`;
}

export function buildBeautyPostSessionInboxDraft(options?: {
  guestFirstName?: string;
  productName?: string;
  payUrl?: string;
}): { body: string; steps: string[] } {
  const greeting = options?.guestFirstName ? `Hi ${options.guestFirstName},\n\n` : "";
  const product =
    options?.productName && options?.payUrl
      ? `\n\nIf you'd like aftercare at home, ${options.productName} is one tap away: ${options.payUrl}`
      : options?.productName
        ? `\n\nReception also has ${options.productName} if you'd like to grab it before you go.`
        : "";
  const body = `${greeting}Thanks for visiting today — follow the aftercare your tech shared.${product}\n\nReply here if you have any questions.`;
  return {
    body,
    steps: [
      "Open the guest thread from today's completed session.",
      "Edit the draft — add or swap a product from your mini store.",
      "Send when ready; guest pays via the link on /b if Stripe is connected.",
    ],
  };
}
