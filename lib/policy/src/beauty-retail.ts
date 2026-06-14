/** Beauty mini-store — re-exports tenant retail hub for backward compatibility. */
import {
  TENANT_RETAIL_PROGRAM,
  buildTenantPostSessionInboxDraft,
  buildTenantRetailPaySms,
  defaultTenantRetailStoreSettings,
  isTenantRetailVisibleOnPublicBook,
  parseTenantRetailStoreSettings,
  resolveTenantRetailPack,
  type TenantRetailProductTemplate,
  type TenantRetailStoreSettings,
} from "./tenant-retail-program";

export type BeautyRetailStoreSettings = TenantRetailStoreSettings;
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

const beautyPack = resolveTenantRetailPack("beauty")!;

export const BEAUTY_RETAIL_PROGRAM = {
  title: beautyPack.ownerTitle,
  subtitle: beautyPack.ownerSubtitle,
  maxActiveProducts: TENANT_RETAIL_PROGRAM.maxActiveProducts,
  publicMaxVisible: TENANT_RETAIL_PROGRAM.publicMaxVisible,
  defaultTitle: beautyPack.defaultPublicTitle,
  inventoryHint: TENANT_RETAIL_PROGRAM.inventoryHint,
  maxCartLines: TENANT_RETAIL_PROGRAM.maxCartLines,
  maxQtyPerLine: TENANT_RETAIL_PROGRAM.maxQtyPerLine,
} as const;

export { normalizeRetailCartItems } from "./tenant-retail-program";

export const BEAUTY_RETAIL_CATEGORIES = beautyPack.categories;

export const BEAUTY_RETAIL_TEMPLATES: Array<
  Omit<BeautyRetailProduct, "id"> & { category: string }
> = beautyPack.templates as TenantRetailProductTemplate[];

export const defaultBeautyRetailStoreSettings = defaultTenantRetailStoreSettings;
export const parseBeautyRetailStoreSettings = parseTenantRetailStoreSettings;
export const isBeautyRetailVisibleOnPublicBook = isTenantRetailVisibleOnPublicBook;

export {
  formatRetailInventoryLabel,
  isRetailProductInStock,
} from "./tenant-retail-program";

export function buildBeautyRetailPaySms(
  args: Parameters<typeof buildTenantRetailPaySms>[0],
): string {
  return buildTenantRetailPaySms(args);
}

export function buildBeautyPostSessionInboxDraft(
  options?: Parameters<typeof buildTenantPostSessionInboxDraft>[1],
): ReturnType<typeof buildTenantPostSessionInboxDraft> {
  return buildTenantPostSessionInboxDraft("beauty", options);
}
