import { db, staffTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getBusinessesForUser } from "./businesses.service";

export type ExperienceStaff = {
  id: string;
  displayName: string;
};

export type ExperienceBusiness = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  city: string | null;
  staff: ExperienceStaff[];
};

export type ExperienceMap = {
  seeded: boolean;
  businessCount: number;
  businesses: ExperienceBusiness[];
  urls: {
    dashboardBase: string;
    internalBase: string;
    marketingBase: string;
  };
};

export async function getExperienceMapForUser(userId: string): Promise<ExperienceMap> {
  const dashboardBase =
    process.env.DASHBOARD_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:5173";
  const internalBase =
    process.env.INTERNAL_APP_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:5175";
  const marketingBase =
    process.env.MARKETING_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:5174";

  const businesses = await getBusinessesForUser(userId);
  const enriched: ExperienceBusiness[] = [];

  for (const b of businesses) {
    const staffRows = await db
      .select({
        id: staffTable.id,
        displayName: staffTable.displayName,
        firstName: staffTable.firstName,
        lastName: staffTable.lastName,
      })
      .from(staffTable)
      .where(eq(staffTable.businessId, b.id))
      .limit(8);

    enriched.push({
      id: b.id,
      name: b.name,
      slug: b.slug,
      category: b.category,
      city: b.city,
      staff: staffRows.map((s) => ({
        id: s.id,
        displayName:
          s.displayName ??
          (`${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || "Staff"),
      })),
    });
  }

  return {
    seeded: enriched.length > 0,
    businessCount: enriched.length,
    businesses: enriched,
    urls: { dashboardBase, internalBase, marketingBase },
  };
}
