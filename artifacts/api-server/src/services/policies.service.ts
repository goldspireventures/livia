import {
  resolveBusinessPolicies,
  type BusinessPolicyInput,
  type ResolvedBusinessPolicies,
  parseOperationalPolicy,
  mergeOperationalPolicy,
} from "@workspace/policy";
import { db, franchiseLinksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getBusinessById } from "./businesses.service";

export async function getFranchisePolicyOverride(
  franchiseeBusinessId: string,
): Promise<Record<string, unknown> | null> {
  const [link] = await db
    .select({ override: franchiseLinksTable.policyPackOverride })
    .from(franchiseLinksTable)
    .where(
      and(
        eq(franchiseLinksTable.franchiseeBusinessId, franchiseeBusinessId),
        eq(franchiseLinksTable.isActive, true),
      ),
    );
  const raw = link?.override;
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
}

export function policiesFromBusiness(
  biz: NonNullable<Awaited<ReturnType<typeof getBusinessById>>>,
  franchiseOverride?: Record<string, unknown> | null,
): ResolvedBusinessPolicies {
  const input: BusinessPolicyInput = {
    id: biz.id,
    name: biz.name,
    country: biz.country,
    currency: biz.currency,
    locale: biz.locale,
    timezone: biz.timezone,
    vertical: biz.vertical as import("@workspace/policy").BusinessVertical,
    tier: biz.tier,
    euRegion: biz.euRegion,
  };
  const base = parseOperationalPolicy(biz.operationalPolicy);
  const merged =
    franchiseOverride && typeof franchiseOverride === "object"
      ? mergeOperationalPolicy(franchiseOverride as Partial<typeof base>, base)
      : base;
  return resolveBusinessPolicies(input, merged);
}

export async function policiesForBusinessId(businessId: string) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  const override = await getFranchisePolicyOverride(businessId);
  return policiesFromBusiness(biz, override);
}

export async function getPoliciesForBusinessId(
  businessId: string,
): Promise<ResolvedBusinessPolicies | null> {
  return policiesForBusinessId(businessId);
}
