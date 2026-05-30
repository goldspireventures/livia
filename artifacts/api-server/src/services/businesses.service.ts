import { db, businessesTable, businessMembershipsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  resolveOnboardingDefaults,
  mandateDefaultsForVertical,
  afterBusinessCreatedState,
  mergeOnboardingState,
  recommendedOperationalPolicyDefaults,
  type BusinessTier,
  type BusinessVertical,
  type OnboardingState,
  validateBusinessNaming,
  defaultStructureKindForCreate,
  type BusinessStructureKind,
  type TenantAttestation,
} from "@workspace/policy";
import { loadVerticalPack } from "@workspace/liv-runtime";
import { generateId } from "../lib/id";
import { validateOnboardingGoLive } from "../lib/onboarding-go-live-gate";

export async function getBusinessById(id: string) {
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, id));
  return biz ?? null;
}

export async function getBusinessBySlug(slug: string) {
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.slug, slug));
  return biz ?? null;
}

export async function getBusinessesForUser(userId: string) {
  const memberships = await db
    .select({ businessId: businessMembershipsTable.businessId })
    .from(businessMembershipsTable)
    .where(eq(businessMembershipsTable.userId, userId));

  const ownedBusinesses = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.ownerId, userId));

  const memberBusinessIds = memberships.map((m) => m.businessId);
  const memberBusinesses =
    memberBusinessIds.length > 0
      ? await Promise.all(
          memberBusinessIds.map((id) =>
            db.select().from(businessesTable).where(eq(businessesTable.id, id)),
          ),
        ).then((results) => results.flat())
      : [];

  const allMap = new Map<string, typeof ownedBusinesses[0]>();
  for (const b of [...ownedBusinesses, ...memberBusinesses]) {
    allMap.set(b.id, b);
  }
  return Array.from(allMap.values());
}

export async function createBusiness(
  ownerId: string,
  data: {
    name: string;
    slug: string;
    description?: string;
    category?: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    timezone?: string;
    city?: string;
    country?: string;
    vertical?: BusinessVertical;
    tier?: BusinessTier;
    locale?: string;
    currency?: string;
    logoUrl?: string;
    instagramHandle?: string;
    parentBusinessId?: string;
    structureKind?: BusinessStructureKind;
    tenantAttestation?: TenantAttestation;
  },
) {
  const id = generateId();
  let parentName: string | null = null;
  if (data.parentBusinessId) {
    const parent = await getBusinessById(data.parentBusinessId);
    if (!parent) throw new Error("PARENT_BUSINESS_NOT_FOUND");
    parentName = parent.name;
  }

  const naming = validateBusinessNaming({
    name: data.name,
    slug: data.slug,
    structureKind: data.structureKind ?? defaultStructureKindForCreate({
      parentBusinessId: data.parentBusinessId,
    }),
    parentBusinessName: parentName,
  });
  if (!naming.ok) {
    throw new Error(`NAMING_${naming.field.toUpperCase()}:${naming.message}`);
  }

  const packDefaults = resolveOnboardingDefaults({
    name: data.name,
    country: data.country,
    category: data.category,
    vertical: data.vertical,
    tier: data.tier,
  });

  const vertical = data.vertical ?? packDefaults.vertical;
  const pack = loadVerticalPack(vertical);
  const structureKind =
    data.structureKind ??
    defaultStructureKindForCreate({ parentBusinessId: data.parentBusinessId });

  const [biz] = await db
    .insert(businessesTable)
    .values({
      id,
      ownerId,
      name: data.name,
      slug: data.slug,
      parentBusinessId: data.parentBusinessId ?? null,
      structureKind,
      livPackConfig: {
        verticalId: pack.id,
        label: pack.label,
        promptModule: pack.promptModule,
        extraToolIds: pack.extraToolIds,
      },
      description: data.description,
      category: data.category ?? packDefaults.category,
      email: data.email,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      timezone: data.timezone ?? packDefaults.timezone,
      city: data.city,
      country: data.country ?? packDefaults.country,
      currency: data.currency ?? packDefaults.currency,
      locale: data.locale ?? packDefaults.locale,
      vertical,
      tier: data.tier ?? packDefaults.tier,
      planId: data.tier ?? packDefaults.tier,
      euRegion: packDefaults.euRegion,
      aiGreeting: packDefaults.aiGreeting,
      logoUrl: data.logoUrl,
      presentationPresetId: "platform-default",
      instagramHandle: data.instagramHandle,
      onboardingState: afterBusinessCreatedState() as unknown as Record<string, unknown>,
      tenantAttestation: data.tenantAttestation as unknown as Record<string, unknown> | undefined,
      operationalPolicy: {
        livMandate: mandateDefaultsForVertical(vertical),
        ...recommendedOperationalPolicyDefaults({ countryIso: data.country ?? packDefaults.country, vertical }),
      } as Record<string, unknown>,
    })
    .returning();

  await db.insert(businessMembershipsTable).values({
    id: generateId(),
    businessId: id,
    userId: ownerId,
    role: "OWNER",
    roleV2: "OWN",
  });

  return biz;
}

export type OnboardingStatePatchResult =
  | OnboardingState
  | { code: "GO_LIVE_REQUIRES_TEST_BOOKING"; message: string };

export function isOnboardingPatchBlocked(
  v: OnboardingStatePatchResult,
): v is { code: "GO_LIVE_REQUIRES_TEST_BOOKING"; message: string } {
  return typeof v === "object" && v !== null && "code" in v;
}

export function parseOnboardingStatePatch(
  raw: unknown,
  existing: unknown,
): OnboardingStatePatchResult | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || typeof raw !== "object") return undefined;
  const state = mergeOnboardingState(existing, raw as Partial<OnboardingState>);
  if (validateOnboardingGoLive(state)) {
    return {
      code: "GO_LIVE_REQUIRES_TEST_BOOKING",
      message:
        "Complete a test booking on your public page or via New booking before finishing setup.",
    };
  }
  return state;
}

export async function updateBusiness(id: string, data: Partial<typeof businessesTable.$inferInsert>) {
  const [updated] = await db
    .update(businessesTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(businessesTable.id, id))
    .returning();
  return updated ?? null;
}

export async function userHasAccessToBusiness(userId: string, businessId: string): Promise<boolean> {
  const [owned] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(and(eq(businessesTable.id, businessId), eq(businessesTable.ownerId, userId)));
  if (owned) return true;

  const [member] = await db
    .select()
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.businessId, businessId),
        eq(businessMembershipsTable.userId, userId),
      ),
    );
  return !!member;
}

// Stricter access check used for billing/channel-control operations
// (Twilio number provisioning + release, per-shop from-address, test-send).
// Returns true only when the user OWNS the business or has an ADMIN
// membership — STAFF members are explicitly excluded so a junior team
// member cannot purchase numbers or change the shop's outbound sender.
export async function userIsOwnerOrAdmin(userId: string, businessId: string): Promise<boolean> {
  const [owned] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(and(eq(businessesTable.id, businessId), eq(businessesTable.ownerId, userId)));
  if (owned) return true;

  const [member] = await db
    .select({ role: businessMembershipsTable.role })
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.businessId, businessId),
        eq(businessMembershipsTable.userId, userId),
      ),
    );
  return member?.role === "OWNER" || member?.role === "ADMIN";
}
