/**
 * Incumbent → OAuth broker mapping for Phase 2 live migration pulls.
 * Owner onboarding may name platforms; Settings catalog stays generic.
 */
import type { ImportEntityKind } from "./import-formats";
import type { IncumbentMigrationSource } from "./incumbent-migration-atlas";

export type MigrationOAuthBrokerId =
  | "migration_acuity"
  | "migration_square"
  | "migration_fresha"
  | "calendar_google";

export type MigrationOAuthBrokerDef = {
  /** Integration catalog + OAuth config id */
  catalogId: MigrationOAuthBrokerId;
  incumbentIds: string[];
  /** Env var that enables live OAuth for this workspace */
  envKey: string;
  entities: ImportEntityKind[];
  /** Generic owner label (Settings — no product names) */
  catalogLabel: string;
};

export const MIGRATION_OAUTH_BROKERS: Record<MigrationOAuthBrokerId, MigrationOAuthBrokerDef> = {
  migration_acuity: {
    catalogId: "migration_acuity",
    incumbentIds: ["acuity"],
    envKey: "ACUITY_CLIENT_ID",
    entities: ["clients", "services", "appointments"],
    catalogLabel: "Previous scheduler (OAuth A)",
  },
  migration_square: {
    catalogId: "migration_square",
    incumbentIds: ["square_appointments"],
    envKey: "SQUARE_APPLICATION_ID",
    entities: ["clients", "services", "appointments", "staff"],
    catalogLabel: "Previous scheduler (OAuth B)",
  },
  migration_fresha: {
    catalogId: "migration_fresha",
    incumbentIds: ["fresha"],
    envKey: "FRESHA_CLIENT_ID",
    entities: ["clients", "services", "appointments"],
    catalogLabel: "Salon marketplace (partner read)",
  },
  calendar_google: {
    catalogId: "calendar_google",
    incumbentIds: ["google_calendar"],
    envKey: "GOOGLE_OAUTH_CLIENT_ID",
    entities: ["appointments"],
    catalogLabel: "External calendar sync",
  },
};

export const MIGRATION_OAUTH_BROKER_IDS = Object.keys(
  MIGRATION_OAUTH_BROKERS,
) as MigrationOAuthBrokerId[];

export function isMigrationOAuthBrokerId(id: string): id is MigrationOAuthBrokerId {
  return id in MIGRATION_OAUTH_BROKERS;
}

export function migrationOAuthBrokerForIncumbent(
  incumbentId: string,
): MigrationOAuthBrokerId | null {
  for (const [brokerId, def] of Object.entries(MIGRATION_OAUTH_BROKERS)) {
    if (def.incumbentIds.includes(incumbentId)) {
      return brokerId as MigrationOAuthBrokerId;
    }
  }
  return null;
}

export function migrationOAuthBrokerDef(
  brokerId: MigrationOAuthBrokerId,
): MigrationOAuthBrokerDef {
  return MIGRATION_OAUTH_BROKERS[brokerId];
}

export function isMigrationOAuthLive(
  brokerId: string,
  envConfigured: (key: string) => boolean,
): boolean {
  if (!isMigrationOAuthBrokerId(brokerId)) return false;
  const envKey = MIGRATION_OAUTH_BROKERS[brokerId].envKey;
  return envConfigured(envKey);
}

export function incumbentSupportsOAuthPull(source: IncumbentMigrationSource): boolean {
  return Boolean(source.oauthBrokerId);
}

export function resolveIncumbentLivStatus(
  source: IncumbentMigrationSource,
  envConfigured: (key: string) => boolean,
): IncumbentMigrationSource["livStatus"] {
  if (
    source.oauthBrokerId &&
    isMigrationOAuthLive(source.oauthBrokerId, envConfigured)
  ) {
    return "oauth_live";
  }
  return source.livStatus;
}
