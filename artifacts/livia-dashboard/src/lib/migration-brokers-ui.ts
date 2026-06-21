export type BrokerStatus = {
  id: string;
  label: string;
  mode: string;
  category?: string;
  connected: boolean;
  selfServe?: boolean;
  note: string;
  importKind?: string;
};

export type MigrationBrokerCategory =
  | "scheduling"
  | "payments"
  | "accounting"
  | "calendar"
  | "marketing"
  | "fitness"
  | "messaging";

export type MigrationBrokerAction =
  | { type: "scroll"; elementId: string; label: string }
  | { type: "link"; href: string; label: string }
  | { type: "none"; label: string; hint: string };

export type MigrationBrokerUiMeta = {
  category: MigrationBrokerCategory;
  ownerSummary: string;
  action: MigrationBrokerAction;
};

export const MIGRATION_BROKER_CATEGORY_LABELS: Record<MigrationBrokerCategory, string> = {
  scheduling: "Scheduling & bookings",
  payments: "Payments",
  accounting: "Accounting exports",
  calendar: "Calendar sync",
  marketing: "Guest marketing",
  fitness: "Classes & memberships",
  messaging: "Messaging channels",
};

const CSV_IMPORT_ACTION: MigrationBrokerAction = {
  type: "scroll",
  elementId: "universal-import-panel",
  label: "Import CSV",
};

/** Owner-facing copy — generic only, no third-party product names. */
export const MIGRATION_BROKER_UI: Record<string, MigrationBrokerUiMeta> = {
  import_clients_csv: {
    category: "scheduling",
    ownerSummary: "Paste a client export from your previous booking tool.",
    action: CSV_IMPORT_ACTION,
  },
  import_services_csv: {
    category: "scheduling",
    ownerSummary: "Import your service menu with duration and price.",
    action: CSV_IMPORT_ACTION,
  },
  import_appointments_csv: {
    category: "scheduling",
    ownerSummary: "Bring forward upcoming appointments from a spreadsheet.",
    action: CSV_IMPORT_ACTION,
  },
  import_staff_csv: {
    category: "scheduling",
    ownerSummary: "Import team names and emails.",
    action: CSV_IMPORT_ACTION,
  },
  scheduling_api_read: {
    category: "scheduling",
    ownerSummary: "Read-only sync when your workspace API key is configured.",
    action: {
      type: "none",
      label: "Platform connect",
      hint: "API migration is enabled by your workspace admin during beta.",
    },
  },
  salon_suite_api_read: {
    category: "scheduling",
    ownerSummary: "Import clients and appointments from a salon-suite API.",
    action: {
      type: "none",
      label: "Platform connect",
      hint: "Concierge-led during beta — CSV import works today.",
    },
  },
  marketplace_bookings_tag: {
    category: "scheduling",
    ownerSummary: "Tag marketplace-sourced bookings for margin reporting.",
    action: {
      type: "none",
      label: "Coming soon",
      hint: "Marketplace tags ship with reports depth.",
    },
  },
  payments_stripe: {
    category: "payments",
    ownerSummary: "Collect deposits and card payments at booking.",
    action: {
      type: "link",
      href: "/settings?tab=billing#commerce-fix",
      label: "Set up payments",
    },
  },
  payments_square: {
    category: "payments",
    ownerSummary: "Sync in-person payments when connected.",
    action: {
      type: "none",
      label: "Platform connect",
      hint: "Square-style payment sync is platform-configured during beta.",
    },
  },
  accounting_xero: {
    category: "accounting",
    ownerSummary: "Weekly settlement CSV for your accountant.",
    action: {
      type: "none",
      label: "CSV export",
      hint: "Settlement CSV is available from Reports when enabled.",
    },
  },
  accounting_quickbooks: {
    category: "accounting",
    ownerSummary: "Settlement CSV for accounting handoff.",
    action: {
      type: "none",
      label: "CSV export",
      hint: "Use settlement CSV until live accounting OAuth ships.",
    },
  },
  calendar_google: {
    category: "calendar",
    ownerSummary: "Two-way calendar sync for staff availability.",
    action: {
      type: "none",
      label: "Coming soon",
      hint: "Google Calendar OAuth rolls out platform-wide.",
    },
  },
  fitness_class_csv: {
    category: "fitness",
    ownerSummary: "Import class clients and pack balances.",
    action: CSV_IMPORT_ACTION,
  },
  marketing_email_events: {
    category: "marketing",
    ownerSummary: "Package expiring and win-back audience events.",
    action: {
      type: "none",
      label: "Coming soon",
      hint: "Email marketing events ship with automations.",
    },
  },
  messaging_whatsapp: {
    category: "messaging",
    ownerSummary: "Arrival, intake, and booking templates.",
    action: { type: "link", href: "/settings?tab=comms", label: "Open channels" },
  },
};

export function migrationBrokerMeta(broker: BrokerStatus): MigrationBrokerUiMeta {
  const fromId = MIGRATION_BROKER_UI[broker.id];
  if (fromId) return fromId;

  const category = (broker.category as MigrationBrokerCategory) ?? "scheduling";
  return {
    category,
    ownerSummary: broker.note,
    action: broker.selfServe
      ? CSV_IMPORT_ACTION
      : {
          type: "none",
          label: "Platform connect",
          hint: "Contact support if you need this import path.",
        },
  };
}

/** Brokers an owner should see without expanding the full roadmap. */
export function migrationBrokersForOwner(brokers: BrokerStatus[]): BrokerStatus[] {
  return brokers.filter((b) => b.selfServe || b.connected || b.id.startsWith("import_"));
}

export function migrationBrokerModeLabel(mode: string): string {
  if (mode === "csv_import" || mode === "csv_only") return "CSV";
  if (mode === "oauth" || mode === "oauth_stub") return "OAuth";
  if (mode === "webhook_out") return "Webhook";
  return "API";
}

export function brokerCategory(broker: BrokerStatus): MigrationBrokerCategory {
  return migrationBrokerMeta(broker).category;
}
