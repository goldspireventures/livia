import {
  resolveMigrationAutomationTruth,
  resolveMigrationIngestProfile,
  migrationPartnerBrokerForIncumbent,
  migrationOAuthBrokerForIncumbent,
  isMigrationPartnerLive,
} from "@workspace/policy";
import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  initialOnboardingState,
  mergeOnboardingState,
  onboardingChecklistSchema,
  onboardingStateSchema,
} from "@workspace/policy";
import {
  listMigrationOAuthCapabilities,
  runMigrationOAuthPull,
} from "./migration-oauth-import.service";
import {
  listMigrationPartnerCapabilities,
  runMigrationPartnerPull,
} from "./migration-partner-import.service";
import {
  getMigrationImportJob,
  requestMigrationIngest,
  type MigrationIngestRequest,
} from "./migration-import-job.service";

export type { ImportOnboardingSideEffects } from "./import-onboarding.service";
export { applyImportToOnboarding } from "./import-onboarding.service";

function envConfigured(key: string): boolean {
  return typeof process.env[key] === "string" && process.env[key]!.length > 0;
}

export async function getMigrationSourceRuntimeProfile(
  businessId: string,
  sourceId: string,
) {
  const profile = resolveMigrationIngestProfile(sourceId);
  const oauthCaps = await listMigrationOAuthCapabilities(businessId);
  const partnerCaps = await listMigrationPartnerCapabilities();
  const oauthBrokerId = profile?.oauthBrokerId ?? migrationOAuthBrokerForIncumbent(sourceId);
  const partnerBrokerId = migrationPartnerBrokerForIncumbent(sourceId);
  const oauthCap = oauthBrokerId ? oauthCaps.find((c) => c.brokerId === oauthBrokerId) : undefined;
  const partnerCap = partnerBrokerId
    ? partnerCaps.find((c) => c.brokerId === partnerBrokerId)
    : undefined;
  const automation = resolveMigrationAutomationTruth(sourceId, {
    oauthLive: oauthCap?.live,
    oauthConnected: oauthCap?.connected,
    partnerLive: partnerCap?.live,
  });
  return {
    profile,
    automation,
    oauth: oauthCap ?? null,
    partner: partnerCap ?? null,
  };
}

export async function storeMigrationConnection(
  businessId: string,
  fields: {
    migrationSource?: string;
    migrationBookingUrl?: string;
    migrationExternalId?: string;
  },
) {
  const [biz] = await db
    .select({ onboardingState: businessesTable.onboardingState })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  if (!biz) return { ok: false, message: "Business not found" };

  const parsed = onboardingStateSchema.safeParse(biz.onboardingState);
  const base = parsed.success ? parsed.data : initialOnboardingState();
  const checklist = onboardingChecklistSchema.parse({
    ...base?.checklist,
    migrationIntent: base?.checklist?.migrationIntent ?? "switching",
    ...fields,
  });
  const next = mergeOnboardingState(base, { checklist });

  await db
    .update(businessesTable)
    .set({ onboardingState: next as unknown as Record<string, unknown> })
    .where(eq(businessesTable.id, businessId));

  const sourceId = fields.migrationSource ?? checklist.migrationSource ?? "spreadsheet";
  const partnerBrokerId = migrationPartnerBrokerForIncumbent(sourceId);
  const automation = resolveMigrationAutomationTruth(sourceId, {
    partnerLive: partnerBrokerId
      ? isMigrationPartnerLive(partnerBrokerId, envConfigured)
      : false,
  });

  if (fields.migrationBookingUrl) {
    return {
      ok: true,
      message:
        "Link saved. Use Import to mirror public menu names — clients still need export or connect.",
      automation,
      canMirror: true,
    };
  }

  if (fields.migrationExternalId) {
    const partnerLive =
      partnerBrokerId && isMigrationPartnerLive(partnerBrokerId, envConfigured);
    return {
      ok: true,
      message: partnerLive
        ? "Salon ID saved. You can import from partner API now."
        : automation?.honestLimit ?? "Identifier saved.",
      automation,
      canPartnerPull: partnerLive,
    };
  }

  return { ok: true, message: "Saved.", automation };
}

export async function runMigrationIngestPull(
  businessId: string,
  args: { brokerId?: string; incumbentId?: string; externalId?: string },
) {
  const partnerBroker = resolvePartnerBrokerForIngest(args.brokerId, args.incumbentId);
  if (partnerBroker) {
    return runMigrationPartnerPull(businessId, {
      brokerId: partnerBroker as "migration_phorest" | "migration_zenoti",
      incumbentId: args.incumbentId,
      externalId: args.externalId ?? "",
    });
  }
  return runMigrationOAuthPull(businessId, args);
}

function resolvePartnerBrokerForIngest(
  brokerId?: string,
  incumbentId?: string,
): string | null {
  if (brokerId?.startsWith("migration_phorest") || brokerId?.startsWith("migration_zenoti")) {
    return brokerId;
  }
  if (incumbentId) return migrationPartnerBrokerForIncumbent(incumbentId);
  return null;
}

export async function runUnifiedMigrationIngest(
  businessId: string,
  request: MigrationIngestRequest,
) {
  return requestMigrationIngest(businessId, request);
}

export { getMigrationImportJob };
