/**
 * Partner API migration brokers — Phorest, Zenoti, etc.
 * Separate from OAuth brokers; requires workspace partner credentials.
 */
import type { ImportEntityKind } from "./import-formats";

export type MigrationPartnerBrokerId = "migration_phorest" | "migration_zenoti";

export type MigrationPartnerBrokerDef = {
  brokerId: MigrationPartnerBrokerId;
  incumbentIds: string[];
  /** All must be set for live partner pull */
  envKeys: string[];
  entities: ImportEntityKind[];
  /** Owner-facing when not configured */
  unavailableMessage: string;
};

export const MIGRATION_PARTNER_BROKERS: Record<
  MigrationPartnerBrokerId,
  MigrationPartnerBrokerDef
> = {
  migration_phorest: {
    brokerId: "migration_phorest",
    incumbentIds: ["phorest"],
    envKeys: ["PHOREST_PARTNER_USERNAME", "PHOREST_PARTNER_PASSWORD"],
    entities: ["clients", "services", "appointments"],
    unavailableMessage:
      "Phorest partner API is not configured on this workspace. Upload CSV exports from Manager.",
  },
  migration_zenoti: {
    brokerId: "migration_zenoti",
    incumbentIds: ["zenoti"],
    envKeys: ["ZENOTI_PARTNER_API_KEY"],
    entities: ["clients", "services", "appointments"],
    unavailableMessage:
      "Zenoti partner API is not configured on this workspace. Request a data export from Zenoti support.",
  },
};

export const MIGRATION_PARTNER_BROKER_IDS = Object.keys(
  MIGRATION_PARTNER_BROKERS,
) as MigrationPartnerBrokerId[];

export function isMigrationPartnerBrokerId(id: string): id is MigrationPartnerBrokerId {
  return id in MIGRATION_PARTNER_BROKERS;
}

export function migrationPartnerBrokerForIncumbent(
  incumbentId: string,
): MigrationPartnerBrokerId | null {
  for (const def of Object.values(MIGRATION_PARTNER_BROKERS)) {
    if (def.incumbentIds.includes(incumbentId)) return def.brokerId;
  }
  return null;
}

export function isMigrationPartnerLive(
  brokerId: string,
  envConfigured: (key: string) => boolean,
): boolean {
  if (!isMigrationPartnerBrokerId(brokerId)) return false;
  return MIGRATION_PARTNER_BROKERS[brokerId].envKeys.every((k) => envConfigured(k));
}
