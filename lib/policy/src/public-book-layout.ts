/**
 * W5 `/b` layout density — scales guest storefront without one-off surface forks.
 * @see docs/design/EXPERIENCE-ARCHITECTURE.md
 */

import type { BusinessVertical } from "./types";
import { businessVocabulary } from "./vocabulary";

export type PublicBookSectionId = "treatments" | "team" | "shop";

export type PublicBookStaffPickerMode = "strip" | "grid" | "collapsible";

/** featured = 2×2 hero + overflow; expanded = full category grid; filtered = grid + search/chips */
export type PublicBookCatalogMode = "featured" | "expanded" | "filtered";

/** rail = sticky booking aside; section = full-width shop block below catalog */
export type PublicBookShopPlacement = "rail" | "section";

export type PublicBookLayoutDensity = {
  showSectionNav: boolean;
  sections: PublicBookSectionId[];
  staffPicker: PublicBookStaffPickerMode;
  catalogMode: PublicBookCatalogMode;
  shopPlacement: PublicBookShopPlacement;
  productPreviewLimit: number;
  /** Team block after catalog when picker is heavy — keeps treatments above the fold */
  teamAfterCatalog: boolean;
};

export const PUBLIC_BOOK_CATALOG_EXPANDED_THRESHOLD = 7;
export const PUBLIC_BOOK_CATALOG_FILTERED_THRESHOLD = 12;
export const PUBLIC_BOOK_SHOP_SECTION_THRESHOLD = 5;
export const PUBLIC_BOOK_PRODUCT_PREVIEW_LIMIT = 8;

export function resolvePublicBookLayoutDensity(signals: {
  staffCount: number;
  serviceCount: number;
  productCount: number;
  staffPickerEnabled: boolean;
  shopEnabled: boolean;
}): PublicBookLayoutDensity {
  const staff = Math.max(0, signals.staffCount);
  const services = Math.max(0, signals.serviceCount);
  const products = Math.max(0, signals.productCount);

  const sections: PublicBookSectionId[] = ["treatments"];
  if (signals.staffPickerEnabled && staff >= 2) sections.push("team");
  if (signals.shopEnabled && products > 0) sections.push("shop");

  const showSectionNav =
    sections.length >= 2 &&
    (services >= PUBLIC_BOOK_CATALOG_EXPANDED_THRESHOLD ||
      products >= 4 ||
      (signals.staffPickerEnabled && staff >= 6));

  let staffPicker: PublicBookStaffPickerMode = "strip";
  if (signals.staffPickerEnabled && staff >= 8) staffPicker = "collapsible";
  else if (signals.staffPickerEnabled && staff >= 5) staffPicker = "grid";

  let catalogMode: PublicBookCatalogMode = "featured";
  if (services >= PUBLIC_BOOK_CATALOG_FILTERED_THRESHOLD) catalogMode = "filtered";
  else if (services >= PUBLIC_BOOK_CATALOG_EXPANDED_THRESHOLD) catalogMode = "expanded";

  const shopPlacement: PublicBookShopPlacement =
    products >= PUBLIC_BOOK_SHOP_SECTION_THRESHOLD ||
    services >= PUBLIC_BOOK_CATALOG_FILTERED_THRESHOLD ||
    showSectionNav
      ? "section"
      : "rail";

  const productPreviewLimit =
    products > PUBLIC_BOOK_PRODUCT_PREVIEW_LIMIT ? PUBLIC_BOOK_PRODUCT_PREVIEW_LIMIT : products;

  return {
    showSectionNav,
    sections,
    staffPicker,
    catalogMode,
    shopPlacement,
    productPreviewLimit,
    teamAfterCatalog: staffPicker !== "strip",
  };
}

/** Guest-facing section nav labels on `/book` — vocabulary-aware. */
export function publicBookSectionLabels(
  vertical?: string | null,
): Record<PublicBookSectionId, string> {
  const vocab = businessVocabulary(vertical ?? "beauty", null);
  return {
    treatments: vocab.publicBookCatalogTitle,
    team: vocab.teamNoun,
    shop: "Shop",
  };
}
