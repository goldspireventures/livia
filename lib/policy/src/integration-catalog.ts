/**
 * Tenant integration catalog — generic labels only (no third-party product names).
 */

export type IntegrationCategory =
  | "scheduling"
  | "payments"
  | "accounting"
  | "calendar"
  | "marketing"
  | "fitness"
  | "messaging";

export type IntegrationMode = "csv_import" | "oauth" | "api_read" | "webhook_out";

export type IntegrationCatalogEntry = {
  id: string;
  label: string;
  category: IntegrationCategory;
  mode: IntegrationMode;
  /** Env key that enables live connect (empty = always available for CSV) */
  envKey?: string;
  ownerSummary: string;
  /** What the owner can do today without concierge */
  selfServe: boolean;
  importKind?: "clients" | "services" | "appointments" | "staff" | "settlement";
};

export const INTEGRATION_CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  scheduling: "Scheduling & bookings",
  payments: "Payments",
  accounting: "Accounting exports",
  calendar: "Calendar sync",
  marketing: "Guest marketing",
  fitness: "Classes & memberships",
  messaging: "Messaging channels",
};

/** Canonical integration catalog — policy hub source of truth. */
export const INTEGRATION_CATALOG: IntegrationCatalogEntry[] = [
  {
    id: "import_clients_csv",
    label: "Client list (CSV)",
    category: "scheduling",
    mode: "csv_import",
    ownerSummary: "Paste or upload a client export from your previous booking tool.",
    selfServe: true,
    importKind: "clients",
  },
  {
    id: "import_services_csv",
    label: "Service menu (CSV)",
    category: "scheduling",
    mode: "csv_import",
    ownerSummary: "Import your treatment or service menu with duration and price.",
    selfServe: true,
    importKind: "services",
  },
  {
    id: "import_appointments_csv",
    label: "Upcoming appointments (CSV)",
    category: "scheduling",
    mode: "csv_import",
    ownerSummary: "Bring forward confirmed bookings from a spreadsheet export.",
    selfServe: true,
    importKind: "appointments",
  },
  {
    id: "import_staff_csv",
    label: "Team roster (CSV)",
    category: "scheduling",
    mode: "csv_import",
    ownerSummary: "Import staff names and emails to seed your team.",
    selfServe: true,
    importKind: "staff",
  },
  {
    id: "scheduling_api_read",
    label: "Previous scheduler (API)",
    category: "scheduling",
    mode: "api_read",
    envKey: "LEGACY_SCHEDULER_API_KEY",
    ownerSummary: "Read-only appointment sync when your workspace API key is configured.",
    selfServe: false,
  },
  {
    id: "salon_suite_api_read",
    label: "Salon suite export (API)",
    category: "scheduling",
    mode: "api_read",
    envKey: "SALON_SUITE_API_KEY",
    ownerSummary: "Import clients and appointments from a salon-suite API when enabled.",
    selfServe: false,
  },
  {
    id: "marketplace_bookings_tag",
    label: "Marketplace booking tags",
    category: "scheduling",
    mode: "api_read",
    ownerSummary: "Tag imported marketplace bookings for margin reporting.",
    selfServe: false,
  },
  {
    id: "payments_stripe",
    label: "Card payments",
    category: "payments",
    mode: "oauth",
    envKey: "STRIPE_SECRET_KEY",
    ownerSummary: "Collect deposits and card payments at booking.",
    selfServe: true,
  },
  {
    id: "payments_square",
    label: "In-person card terminal",
    category: "payments",
    mode: "api_read",
    envKey: "SQUARE_APPLICATION_ID",
    ownerSummary: "Sync in-person payments when a card terminal integration is connected.",
    selfServe: false,
  },
  {
    id: "accounting_xero",
    label: "Accounting export (cloud ledger A)",
    category: "accounting",
    mode: "csv_import",
    envKey: "XERO_CLIENT_ID",
    ownerSummary: "Weekly settlement CSV for your accountant.",
    selfServe: true,
    importKind: "settlement",
  },
  {
    id: "accounting_quickbooks",
    label: "Accounting export (cloud ledger B)",
    category: "accounting",
    mode: "csv_import",
    envKey: "QUICKBOOKS_CLIENT_ID",
    ownerSummary: "Settlement CSV until live accounting OAuth is configured.",
    selfServe: true,
    importKind: "settlement",
  },
  {
    id: "calendar_google",
    label: "External calendar sync",
    category: "calendar",
    mode: "oauth",
    envKey: "GOOGLE_OAUTH_CLIENT_ID",
    ownerSummary: "Two-way calendar sync for staff availability.",
    selfServe: false,
  },
  {
    id: "fitness_class_csv",
    label: "Class roster (CSV)",
    category: "fitness",
    mode: "csv_import",
    envKey: "FITNESS_LEGACY_API_KEY",
    ownerSummary: "Import class clients and pack balances for fitness studios.",
    selfServe: false,
    importKind: "clients",
  },
  {
    id: "marketing_email_events",
    label: "Email marketing events",
    category: "marketing",
    mode: "webhook_out",
    envKey: "MAILCHIMP_API_KEY",
    ownerSummary: "Package expiring and win-back audience events.",
    selfServe: false,
  },
  {
    id: "messaging_whatsapp",
    label: "WhatsApp Business",
    category: "messaging",
    mode: "oauth",
    envKey: "META_WHATSAPP_TOKEN",
    ownerSummary: "Arrival, intake, and booking templates via channels.",
    selfServe: true,
  },
];

export function listIntegrationCatalog(): IntegrationCatalogEntry[] {
  return INTEGRATION_CATALOG;
}

export function getIntegrationCatalogEntry(id: string): IntegrationCatalogEntry | null {
  return INTEGRATION_CATALOG.find((e) => e.id === id) ?? null;
}

export function integrationCatalogStatus(
  entry: IntegrationCatalogEntry,
  envConfigured: (key: string) => boolean,
): { connected: boolean; note: string } {
  if (entry.mode === "csv_import" && entry.selfServe) {
    return { connected: true, note: "Paste CSV in Settings → Integrations or during onboarding." };
  }
  if (!entry.envKey) {
    return { connected: false, note: "Available via concierge migration during beta." };
  }
  const connected = envConfigured(entry.envKey);
  return {
    connected,
    note: connected
      ? `${entry.label} is configured for this workspace.`
      : `Set ${entry.envKey} on the platform to enable live connect.`,
  };
}

export function selfServeIntegrations(
  envConfigured: (key: string) => boolean,
): IntegrationCatalogEntry[] {
  return INTEGRATION_CATALOG.filter((e) => e.selfServe || (e.envKey && envConfigured(e.envKey)));
}
