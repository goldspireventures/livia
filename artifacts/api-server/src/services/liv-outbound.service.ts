import { db, eventVendorSiteTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  type BusinessVertical,
  type LivOutboundCopyKey,
  defaultLivOutboundOverridesForVertical,
  LIV_EVENT_SITE_OUTBOUND_MAP,
  livOutboundKeysForVertical,
  livOutboundTemplatesSettingsCopy,
  resolveLivOutboundCopy,
} from "@workspace/policy";
import { getBusinessById, updateBusiness } from "./businesses.service";

type Overrides = Partial<Record<LivOutboundCopyKey, string>>;

async function getEventVendorSiteRow(businessId: string) {
  const [row] = await db
    .select()
    .from(eventVendorSiteTable)
    .where(eq(eventVendorSiteTable.businessId, businessId))
    .limit(1);
  return row ?? null;
}

async function clearLegacyEventSiteOutbound(businessId: string) {
  await db
    .update(eventVendorSiteTable)
    .set({
      declineReplyTemplate: null,
      enquiryThanksTemplate: null,
      quoteWhatsappTemplate: null,
      updatedAt: new Date(),
    })
    .where(eq(eventVendorSiteTable.businessId, businessId));
}

/** One-time lift from event_vendor_site columns → businesses.liv_outbound_overrides. */
export async function ensureLegacyOutboundMigrated(businessId: string): Promise<void> {
  const biz = await getBusinessById(businessId);
  if (!biz || biz.vertical !== "event-vendors") return;

  const site = await getEventVendorSiteRow(businessId);
  if (!site) return;

  const current = { ...((biz.livOutboundOverrides as Overrides) ?? {}) };
  const lift: Overrides = {};
  let hadLegacy = false;

  for (const [siteKey, outboundKey] of Object.entries(LIV_EVENT_SITE_OUTBOUND_MAP)) {
    const legacy = (site as unknown as Record<string, string | null | undefined>)[siteKey];
    if (!legacy?.trim()) continue;
    hadLegacy = true;
    if (!current[outboundKey]?.trim()) {
      lift[outboundKey] = legacy.trim();
    }
  }

  if (!hadLegacy) return;

  if (Object.keys(lift).length > 0) {
    await patchLivOutboundOverrides(businessId, lift);
  }
  await clearLegacyEventSiteOutbound(businessId);
}

export function extractLegacyOutboundPatch(
  patch: Record<string, unknown>,
): { sitePatch: Record<string, unknown>; outboundPatch: Partial<Record<LivOutboundCopyKey, string>> } {
  const sitePatch = { ...patch };
  const outboundPatch: Partial<Record<LivOutboundCopyKey, string>> = {};

  for (const [siteKey, outboundKey] of Object.entries(LIV_EVENT_SITE_OUTBOUND_MAP)) {
    const value = sitePatch[siteKey];
    if (typeof value === "string") {
      outboundPatch[outboundKey] = value;
      delete sitePatch[siteKey];
    }
  }

  return { sitePatch, outboundPatch };
}

export async function getLivOutboundOverride(
  businessId: string,
  key: LivOutboundCopyKey,
): Promise<string | null> {
  await ensureLegacyOutboundMigrated(businessId);

  const biz = await getBusinessById(businessId);
  if (!biz) return null;

  const fromBusiness = (biz.livOutboundOverrides as Overrides | null)?.[key];
  if (fromBusiness?.trim()) return fromBusiness.trim();

  return null;
}

export async function resolveLivOutboundForBusiness(
  businessId: string,
  key: LivOutboundCopyKey,
  vars: Record<string, string>,
): Promise<string> {
  const override = await getLivOutboundOverride(businessId, key);
  return resolveLivOutboundCopy(key, vars, override);
}

export async function getLivOutboundSettingsView(businessId: string) {
  await ensureLegacyOutboundMigrated(businessId);

  const biz = await getBusinessById(businessId);
  if (!biz) return null;

  const vertical = biz.vertical ?? "hair";
  const settings = livOutboundTemplatesSettingsCopy(vertical);
  const overrides: Overrides = { ...((biz.livOutboundOverrides as Overrides) ?? {}) };

  return {
    vertical,
    keys: livOutboundKeysForVertical(vertical),
    overrides,
    fields: settings.fields,
    sectionTitle: settings.sectionTitle,
    sectionSubtitle: settings.sectionSubtitle,
  };
}

export async function patchLivOutboundOverrides(
  businessId: string,
  patch: Partial<Record<LivOutboundCopyKey, string>>,
) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;

  const current = { ...((biz.livOutboundOverrides as Overrides) ?? {}) };
  for (const [key, value] of Object.entries(patch) as Array<[LivOutboundCopyKey, string]>) {
    if (value.trim()) current[key] = value.trim();
    else delete current[key];
  }

  const row = await updateBusiness(businessId, { livOutboundOverrides: current });

  if (biz.vertical === "event-vendors") {
    await clearLegacyEventSiteOutbound(businessId);
  }

  return row;
}

/** Seed policy defaults when a tenant has no outbound overrides yet (demo repair / new businesses). */
export async function ensureDefaultLivOutboundOverrides(
  businessId: string,
  vertical: BusinessVertical,
): Promise<void> {
  const biz = await getBusinessById(businessId);
  if (!biz) return;

  const existing = (biz.livOutboundOverrides as Overrides | null) ?? {};
  if (Object.keys(existing).length > 0) return;

  const defaults = defaultLivOutboundOverridesForVertical(vertical);
  if (Object.keys(defaults).length === 0) return;

  await patchLivOutboundOverrides(businessId, defaults);
}
