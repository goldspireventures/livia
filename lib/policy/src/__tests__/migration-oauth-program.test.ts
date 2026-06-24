import {
  isMigrationOAuthLive,
  migrationOAuthBrokerForIncumbent,
  MIGRATION_OAUTH_BROKERS,
} from "../migration-oauth-program";

function envConfigured(key: string): boolean {
  return key.length > 0;
}

const cases: Array<{ incumbentId: string; brokerId: string | null }> = [
  { incumbentId: "acuity", brokerId: "migration_acuity" },
  { incumbentId: "square_appointments", brokerId: "migration_square" },
  { incumbentId: "fresha", brokerId: "migration_fresha" },
  { incumbentId: "google_calendar", brokerId: "calendar_google" },
  { incumbentId: "phorest", brokerId: null },
];

for (const c of cases) {
  const resolved = migrationOAuthBrokerForIncumbent(c.incumbentId);
  if (resolved !== c.brokerId) {
    throw new Error(`Expected ${c.incumbentId} → ${c.brokerId}, got ${resolved}`);
  }
}

if (!isMigrationOAuthLive("migration_acuity", () => true)) {
  throw new Error("migration_acuity should be live when env configured");
}
if (isMigrationOAuthLive("migration_acuity", () => false)) {
  throw new Error("migration_acuity should be off without env");
}

if (MIGRATION_OAUTH_BROKERS.migration_square.entities.length < 3) {
  throw new Error("square broker should pull multiple entity kinds");
}

console.log("migration-oauth-program.test.ts ok");
