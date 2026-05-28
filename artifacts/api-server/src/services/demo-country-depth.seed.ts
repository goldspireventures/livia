import { eq } from "drizzle-orm";
import { db, businessesTable } from "@workspace/db";
import { getCountryLocalePack, resolveJurisdictionCode } from "@workspace/policy";

const MARKET_SLUGS = [
  "london-rose-spa",
  "berlin-studio-neun",
  "paris-belle-vue",
  "copenhagen-havn-wellness",
  "shine-studio-belfast",
] as const;

/** Stamp country showcase metadata on market demo shops (not a single gimmick). */
export async function seedCountryDepthOnMarketShops(): Promise<number> {
  let updated = 0;
  for (const slug of MARKET_SLUGS) {
    const [biz] = await db
      .select({ id: businessesTable.id, country: businessesTable.country, operationalPolicy: businessesTable.operationalPolicy })
      .from(businessesTable)
      .where(eq(businessesTable.slug, slug))
      .limit(1);
    if (!biz) continue;

    const jurisdiction = resolveJurisdictionCode(biz.country);
    const localePack = getCountryLocalePack(jurisdiction);
    const raw =
      biz.operationalPolicy && typeof biz.operationalPolicy === "object"
        ? { ...(biz.operationalPolicy as Record<string, unknown>) }
        : {};
    raw.countryShowcase = {
      jurisdiction,
      note: localePack.countryShowcaseNote,
      smsReminderExample: localePack.sms.bookingReminder({
        businessName: slug,
        when: "sample",
      }),
      localizedPublicBook: localePack.publicBooking,
    };

    await db
      .update(businessesTable)
      .set({ operationalPolicy: raw as Record<string, unknown> })
      .where(eq(businessesTable.id, biz.id));
    updated += 1;
  }
  return updated;
}
