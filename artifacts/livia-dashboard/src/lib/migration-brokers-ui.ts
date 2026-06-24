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
  | { type: "oauth"; brokerId: string; label: string }
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
  label: "Import spreadsheet",
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
    ownerSummary: "Read-only sync when your previous tool is connected.",
    action: {
      type: "oauth",
      brokerId: "scheduling_api_read",
      label: "Connect scheduler",
    },
  },
  salon_suite_api_read: {
    category: "scheduling",
    ownerSummary: "Import clients and appointments from your suite account.",
    action: {
      type: "oauth",
      brokerId: "salon_suite_api_read",
      label: "Connect suite",
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
      type: "oauth",
      brokerId: "calendar_google",
      label: "Connect calendar",
    },
  },
  migration_acuity: {
    category: "scheduling",
    ownerSummary: "Read-only pull of clients, services, and appointments when connected.",
    action: {
      type: "oauth",
      brokerId: "migration_acuity",
      label: "Connect scheduler",
    },
  },
  migration_square: {
    category: "scheduling",
    ownerSummary: "Read-only pull of bookings, catalog, customers, and team when connected.",
    action: {
      type: "oauth",
      brokerId: "migration_square",
      label: "Connect scheduler",
    },
  },
  migration_fresha: {
    category: "scheduling",
    ownerSummary: "Partner read of clients and bookings when credentials are configured.",
    action: {
      type: "oauth",
      brokerId: "migration_fresha",
      label: "Connect marketplace",
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
  if (mode === "csv_import" || mode === "csv_only") return "Spreadsheet";
  if (mode === "oauth" || mode === "oauth_stub") return "Connect";
  if (mode === "webhook_out") return "Automatic sync";
  return "Integration";
}

export function brokerCategory(broker: BrokerStatus): MigrationBrokerCategory {
  return migrationBrokerMeta(broker).category;
}
