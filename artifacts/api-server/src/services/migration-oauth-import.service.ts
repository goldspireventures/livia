import {
  type ImportEntityKind,
  isMigrationOAuthBrokerId,
  isMigrationOAuthLive,
  MIGRATION_OAUTH_BROKERS,
  MIGRATION_OAUTH_BROKER_IDS,
  migrationOAuthBrokerForIncumbent,
  type MigrationOAuthBrokerId,
} from "@workspace/policy";
import {
  getTenantAccessToken,
  listTenantIntegrationConnections,
  tenantHasIntegrationConnection,
} from "./integration-oauth.service";
import { runAcuityMigrationImport } from "./acuity-migration-import.service";
import { runSquareMigrationImport } from "./square-migration-import.service";
import { runFreshaMigrationImport } from "./fresha-migration-import.service";
import { runGoogleCalendarMigrationImport } from "./google-calendar-migration-import.service";
import {
  applyImportToOnboarding,
  type ImportOnboardingSideEffects,
} from "./import-onboarding.service";

export type MigrationPullEntityResult = {
  kind: ImportEntityKind;
  imported: number;
  skipped: number;
  errors: string[];
};

export type MigrationOAuthPullResult = {
  ok: boolean;
  brokerId: MigrationOAuthBrokerId;
  message: string;
  results: MigrationPullEntityResult[];
  totalImported: number;
  onboarding?: ImportOnboardingSideEffects;
};

function envConfigured(key: string): boolean {
  return typeof process.env[key] === "string" && process.env[key]!.length > 0;
}

export async function listMigrationOAuthCapabilities(businessId: string) {
  const connections = await listTenantIntegrationConnections(businessId);
  const connected = new Set(connections.map((c) => c.brokerId));

  return MIGRATION_OAUTH_BROKER_IDS.map((brokerId) => {
    const def = MIGRATION_OAUTH_BROKERS[brokerId];
    return {
      brokerId,
      incumbentIds: def.incumbentIds,
      live: isMigrationOAuthLive(brokerId, envConfigured),
      connected: connected.has(brokerId),
      entities: def.entities,
      catalogLabel: def.catalogLabel,
    };
  });
}

export function resolveBrokerForPull(
  brokerId?: string,
  incumbentId?: string,
): MigrationOAuthBrokerId | null {
  if (brokerId && isMigrationOAuthBrokerId(brokerId)) return brokerId;
  if (incumbentId) return migrationOAuthBrokerForIncumbent(incumbentId);
  return null;
}

export async function runMigrationOAuthPull(
  businessId: string,
  args: { brokerId?: string; incumbentId?: string },
): Promise<MigrationOAuthPullResult> {
  const brokerId = resolveBrokerForPull(args.brokerId, args.incumbentId);
  if (!brokerId) {
    return {
      ok: false,
      brokerId: "migration_acuity",
      message: "Unknown migration OAuth broker.",
      results: [],
      totalImported: 0,
    };
  }

  if (!isMigrationOAuthLive(brokerId, envConfigured)) {
    return {
      ok: false,
      brokerId,
      message: `${MIGRATION_OAUTH_BROKERS[brokerId].catalogLabel} is not configured on this workspace — use CSV import meanwhile.`,
      results: [],
      totalImported: 0,
    };
  }

  const connected = await tenantHasIntegrationConnection(businessId, brokerId);
  if (!connected) {
    return {
      ok: false,
      brokerId,
      message: "Connect first, then pull your data into Livia.",
      results: [],
      totalImported: 0,
    };
  }

  const accessToken = await getTenantAccessToken(businessId, brokerId);
  if (!accessToken && brokerId !== "calendar_google") {
    return {
      ok: false,
      brokerId,
      message: "Connection expired — reconnect and try again.",
      results: [],
      totalImported: 0,
    };
  }

  const results: MigrationPullEntityResult[] = [];
  let totalImported = 0;
  const mergedOnboarding: ImportOnboardingSideEffects = {
    actsCompleted: [],
    checklistUpdates: {},
  };

  switch (brokerId) {
    case "migration_acuity": {
      const pull = await runAcuityMigrationImport(businessId, accessToken!);
      for (const [kind, bucket] of Object.entries(pull) as Array<
        [ImportEntityKind, { imported: number; skipped: number; errors: string[] }]
      >) {
        results.push({ kind, ...bucket });
        totalImported += bucket.imported;
        if (bucket.imported > 0) {
          const fx = await applyImportToOnboarding(businessId, kind, bucket.imported);
          mergedOnboarding.actsCompleted.push(...fx.actsCompleted);
          Object.assign(mergedOnboarding.checklistUpdates, fx.checklistUpdates);
        }
      }
      break;
    }
    case "migration_square": {
      const pull = await runSquareMigrationImport(businessId, accessToken!);
      for (const [kind, bucket] of Object.entries(pull) as Array<
        [ImportEntityKind, { imported: number; skipped: number; errors: string[] }]
      >) {
        results.push({ kind, ...bucket });
        totalImported += bucket.imported;
        if (bucket.imported > 0) {
          const fx = await applyImportToOnboarding(businessId, kind, bucket.imported);
          mergedOnboarding.actsCompleted.push(...fx.actsCompleted);
          Object.assign(mergedOnboarding.checklistUpdates, fx.checklistUpdates);
        }
      }
      break;
    }
    case "migration_fresha": {
      const pull = await runFreshaMigrationImport(businessId, accessToken!);
      for (const kind of ["clients", "services", "appointments"] as const) {
        const bucket = pull[kind];
        results.push({ kind, ...bucket });
        totalImported += bucket.imported;
        if (bucket.imported > 0) {
          const fx = await applyImportToOnboarding(businessId, kind, bucket.imported);
          mergedOnboarding.actsCompleted.push(...fx.actsCompleted);
          Object.assign(mergedOnboarding.checklistUpdates, fx.checklistUpdates);
        }
      }
      if (!pull.partnerApiAvailable && totalImported === 0) {
        return {
          ok: false,
          brokerId,
          message: "Fresha partner API unavailable — paste client CSV meanwhile.",
          results,
          totalImported: 0,
        };
      }
      break;
    }
    case "calendar_google": {
      const pull = await runGoogleCalendarMigrationImport(businessId);
      results.push({ kind: "appointments", ...pull.appointments });
      totalImported += pull.appointments.imported;
      if (pull.appointments.imported > 0) {
        const fx = await applyImportToOnboarding(
          businessId,
          "appointments",
          pull.appointments.imported,
        );
        mergedOnboarding.actsCompleted.push(...fx.actsCompleted);
        Object.assign(mergedOnboarding.checklistUpdates, fx.checklistUpdates);
      }
      break;
    }
  }

  mergedOnboarding.actsCompleted = [...new Set(mergedOnboarding.actsCompleted)];

  return {
    ok: totalImported > 0,
    brokerId,
    message:
      totalImported > 0
        ? `Pulled ${totalImported} record(s) into Livia.`
        : "Connected — no new records to import (may already be in Livia).",
    results,
    totalImported,
    onboarding: totalImported > 0 ? mergedOnboarding : undefined,
  };
}
