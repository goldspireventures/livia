import {
  type ImportEntityKind,
  isMigrationPartnerBrokerId,
  isMigrationPartnerLive,
  MIGRATION_PARTNER_BROKERS,
  MIGRATION_PARTNER_BROKER_IDS,
  migrationPartnerBrokerForIncumbent,
  type MigrationPartnerBrokerId,
} from "@workspace/policy";
import { runPhorestMigrationImport } from "./phorest-migration-import.service";
import { runZenotiMigrationImport } from "./zenoti-migration-import.service";
import {
  applyImportToOnboarding,
  type ImportOnboardingSideEffects,
} from "./import-onboarding.service";

export type MigrationPartnerPullResult = {
  ok: boolean;
  brokerId: MigrationPartnerBrokerId;
  message: string;
  results: { kind: ImportEntityKind; imported: number; skipped: number; errors: string[] }[];
  totalImported: number;
  onboarding?: ImportOnboardingSideEffects;
};

function envConfigured(key: string): boolean {
  return typeof process.env[key] === "string" && process.env[key]!.length > 0;
}

export async function listMigrationPartnerCapabilities() {
  return MIGRATION_PARTNER_BROKER_IDS.map((brokerId) => {
    const def = MIGRATION_PARTNER_BROKERS[brokerId];
    return {
      brokerId,
      incumbentIds: def.incumbentIds,
      live: isMigrationPartnerLive(brokerId, envConfigured),
      entities: def.entities,
    };
  });
}

export function resolvePartnerBrokerForPull(
  brokerId?: string,
  incumbentId?: string,
): MigrationPartnerBrokerId | null {
  if (brokerId && isMigrationPartnerBrokerId(brokerId)) return brokerId;
  if (incumbentId) return migrationPartnerBrokerForIncumbent(incumbentId);
  return null;
}

export async function runMigrationPartnerPull(
  businessId: string,
  args: { brokerId?: string; incumbentId?: string; externalId: string },
): Promise<MigrationPartnerPullResult> {
  const brokerId = resolvePartnerBrokerForPull(args.brokerId, args.incumbentId);
  const empty: MigrationPartnerPullResult = {
    ok: false,
    brokerId: "migration_phorest",
    message: "Unknown partner broker.",
    results: [],
    totalImported: 0,
  };
  if (!brokerId) return empty;

  if (!isMigrationPartnerLive(brokerId, envConfigured)) {
    return {
      ok: false,
      brokerId,
      message: MIGRATION_PARTNER_BROKERS[brokerId].unavailableMessage,
      results: [],
      totalImported: 0,
    };
  }

  if (!args.externalId?.trim()) {
    return {
      ok: false,
      brokerId,
      message: "Salon / center ID required for partner import.",
      results: [],
      totalImported: 0,
    };
  }

  let pull:
    | Awaited<ReturnType<typeof runPhorestMigrationImport>>
    | Awaited<ReturnType<typeof runZenotiMigrationImport>>;

  if (brokerId === "migration_phorest") {
    pull = await runPhorestMigrationImport(businessId, args.externalId);
  } else {
    pull = await runZenotiMigrationImport(businessId, args.externalId);
  }

  const results = [
    { kind: "clients" as const, ...pull.clients },
    { kind: "services" as const, ...pull.services },
    { kind: "appointments" as const, ...pull.appointments },
  ];

  const totalImported = results.reduce((n, r) => n + r.imported, 0);
  let onboarding: ImportOnboardingSideEffects | undefined;

  for (const r of results) {
    if (r.imported > 0) {
      const side = await applyImportToOnboarding(businessId, r.kind, r.imported);
      onboarding = {
        actsCompleted: [...(onboarding?.actsCompleted ?? []), ...side.actsCompleted],
        checklistUpdates: { ...(onboarding?.checklistUpdates ?? {}), ...side.checklistUpdates },
      };
    }
  }

  return {
    ok: pull.ok,
    brokerId,
    message: pull.message,
    results,
    totalImported,
    onboarding,
  };
}
