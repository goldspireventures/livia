import {
  integrationCatalogStatus,
  listIntegrationCatalog,
  type IntegrationCatalogEntry,
  type IntegrationCategory,
  type IntegrationMode,
} from "@workspace/policy";
import { runWellnessBrokerSync } from "./wellness-broker-sync.service";
import { listTenantIntegrationConnections } from "./integration-oauth.service";

/** @deprecated Use IntegrationCatalogEntry.id — kept for wellness broker sync routing. */
export type BrokerId =
  | "import_clients_csv"
  | "import_services_csv"
  | "import_appointments_csv"
  | "import_staff_csv"
  | "scheduling_api_read"
  | "salon_suite_api_read"
  | "marketplace_bookings_tag"
  | "payments_stripe"
  | "payments_square"
  | "accounting_xero"
  | "accounting_quickbooks"
  | "calendar_google"
  | "fitness_class_csv"
  | "marketing_email_events"
  | "messaging_whatsapp";

export type BrokerStatus = {
  id: string;
  label: string;
  category: IntegrationCategory;
  mode: IntegrationMode;
  connected: boolean;
  selfServe: boolean;
  note: string;
  importKind?: IntegrationCatalogEntry["importKind"];
};

function envConfigured(key: string): boolean {
  const v = process.env[key];
  return typeof v === "string" && v.length > 0;
}

export async function listIntegrationBrokers(businessId: string): Promise<BrokerStatus[]> {
  const tenantConnections = await listTenantIntegrationConnections(businessId);
  const connectedBrokers = new Set(tenantConnections.map((c) => c.brokerId));

  return listIntegrationCatalog().map((entry) => {
    const status = integrationCatalogStatus(entry, envConfigured);
    const tenantConnected = connectedBrokers.has(entry.id);
    return {
      id: entry.id,
      label: entry.label,
      category: entry.category,
      mode: entry.mode,
      connected: status.connected || tenantConnected,
      selfServe: entry.selfServe,
      note: tenantConnected
        ? `${entry.label} connected for your shop.`
        : status.note,
      importKind: entry.importKind,
    };
  });
}

/** Map legacy sync ids for wellness parallel-run jobs. */
const LEGACY_SYNC_MAP: Record<string, string> = {
  fresha: "migration_fresha",
  mindbody: "fitness_class_csv",
  booksy: "import_clients_csv",
  acuity: "migration_acuity",
  timely: "salon_suite_api_read",
  square: "migration_square",
  square_appointments: "migration_square",
  vagaro: "salon_suite_api_read",
  treatwell: "marketplace_bookings_tag",
  stripe: "payments_stripe",
  xero: "accounting_xero",
  quickbooks: "accounting_quickbooks",
  google_calendar: "calendar_google",
  mailchimp: "marketing_email_events",
  whatsapp: "messaging_whatsapp",
};

export async function triggerBrokerSyncJob(
  businessId: string,
  brokerId: string,
): Promise<{ ok: boolean; message: string; payload?: unknown }> {
  const brokers = await listIntegrationBrokers(businessId);
  const resolvedId = LEGACY_SYNC_MAP[brokerId] ?? brokerId;
  const b = brokers.find((x) => x.id === resolvedId || x.id === brokerId);
  if (!b) return { ok: false, message: "Unknown integration" };
  if (!b.connected && !b.selfServe) {
    return { ok: false, message: b.note };
  }
  if (b.id.startsWith("import_")) {
    return {
      ok: true,
      message: "CSV import available in Settings → Integrations or onboarding migration step.",
    };
  }
  return runWellnessBrokerSync(businessId, brokerId);
}
