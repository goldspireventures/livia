/**
 * Incumbent platform migration atlas — engineering + in-app Liv walkthrough source.
 * Owner Settings import UI stays generic; onboarding source picker may name platforms
 * so owners find the right export path.
 */
import type { BusinessVertical } from "./types";
import type { MigrationOAuthBrokerId } from "./migration-oauth-program";
import { INCUMBENT_MIGRATION_EXTENDED } from "./incumbent-migration-atlas-ext";

export type MigrationEntityKind = "clients" | "services" | "staff" | "appointments" | "hours" | "products";

export type MigrationExportMethod =
  | "self_serve_csv"
  | "self_serve_excel"
  | "in_app_report"
  | "support_request"
  | "oauth_api"
  | "partner_api"
  | "privacy_export"
  | "public_booking_page"
  | "manual_entry";

export type LiviaImportPath =
  | "universal_csv"
  | "magic_setup"
  | "booksy_legacy"
  | "broker_oauth"
  | "broker_api"
  | "concierge"
  | "manual_entry"
  | "not_available";

export type LiviaBrokerStatus =
  | "csv_self_serve"
  | "csv_plus_guide"
  | "oauth_planned"
  | "oauth_live"
  | "oauth_stub"
  | "partner_required"
  | "concierge_only";

export type MigrationEntityExport = {
  kind: MigrationEntityKind;
  available: boolean;
  method: MigrationExportMethod;
  /** Short owner-facing steps (shown in Liv walkthrough). */
  ownerSteps: string[];
  livPath: LiviaImportPath;
  /** Typical column/header hints for universal CSV detect (internal). */
  notes?: string;
};

export type IncumbentMigrationSource = {
  id: string;
  displayName: string;
  /** Primary verticals where this incumbent appears. */
  verticals: BusinessVertical[];
  regions: string[];
  tier: "tier1_heartland" | "tier2_common" | "tier3_adjacent";
  livStatus: LiviaBrokerStatus;
  /** Legacy broker slug in integration-brokers.service if any */
  legacyBrokerId?: string;
  /** Phase 2 OAuth pull broker when workspace credentials are configured */
  oauthBrokerId?: MigrationOAuthBrokerId;
  /** Honest minutes for self-serve CSV path (solo, exports ready). */
  selfServeMinutesEstimate: { min: number; max: number };
  parallelRunRecommended: boolean;
  entities: MigrationEntityExport[];
  /** One-line pitch for source picker */
  pickerSubtitle: string;
  /** Liv opening line when this source is selected */
  livIntro: string;
  /** Official help / developer links (docs only — not shown as endorsement) */
  referenceUrls?: string[];
};

const csv = (kind: MigrationEntityKind, steps: string[], notes?: string): MigrationEntityExport => ({
  kind,
  available: true,
  method: "self_serve_csv",
  ownerSteps: steps,
  livPath: "universal_csv",
  notes,
});

const unavailable = (kind: MigrationEntityKind, method: MigrationExportMethod, steps: string[]): MigrationEntityExport => ({
  kind,
  available: false,
  method,
  ownerSteps: steps,
  livPath: "not_available",
});

/** Canonical incumbent catalog — ordered for onboarding picker (heartland first). */
export const INCUMBENT_MIGRATION_SOURCES: IncumbentMigrationSource[] = [
  {
    id: "phorest",
    displayName: "Phorest",
    verticals: ["hair", "beauty"],
    regions: ["IE", "GB", "DE", "AU"],
    tier: "tier1_heartland",
    livStatus: "partner_required",
    legacyBrokerId: "phorest_migration_broker",
    selfServeMinutesEstimate: { min: 20, max: 45 },
    parallelRunRecommended: true,
    pickerSubtitle: "Salon & spa — CSV exports + partner API",
    livIntro: "Phorest exports are solid once you know where to click. I'll map your menu and clients into Livia — we can run parallel with Phorest for a few weeks if you have staff on the floor.",
    referenceUrls: [
      "https://support.phorest.com/hc/en-us/articles/360019038240",
      "https://developer.phorest.com/docs/csv-export-job-endpoint",
    ],
    entities: [
      csv("services", [
        "Manager → Services → Export all services (per location if multi-site).",
        "Paste the CSV into Livia — I'll detect name, duration, and price.",
      ]),
      csv("clients", [
        "Marketing → Client Export → Emails (CSV) for opted-in list, or",
        "Reports → Top Clients / New Clients with full date range, or",
        "Manager → Business → CSV Export for transaction-linked client history.",
      ]),
      csv("appointments", [
        "Reports → Future Appointments (by staff) for upcoming bookings, or",
        "Manager → Business → CSV Export with a tight forward date range.",
      ]),
      {
        kind: "staff",
        available: true,
        method: "manual_entry",
        ownerSteps: [
          "Phorest has no bulk staff export — tell me your team names in the next step or add them under Team after import.",
        ],
        livPath: "manual_entry",
      },
    ],
  },
  {
    id: "fresha",
    displayName: "Fresha",
    verticals: ["hair", "beauty", "wellness"],
    regions: ["IE", "GB", "EU", "AU", "US"],
    tier: "tier1_heartland",
    livStatus: "oauth_planned",
    legacyBrokerId: "fresha",
    oauthBrokerId: "migration_fresha",
    selfServeMinutesEstimate: { min: 15, max: 35 },
    parallelRunRecommended: true,
    pickerSubtitle: "Marketplace salon — client CSV + Data connector for teams",
    livIntro: "Fresha's client import template maps cleanly. For services and upcoming bookings, export from Reports or paste what you have — I'll fill the gaps from your booking page if needed.",
    referenceUrls: [
      "https://www.fresha.com/help-center/knowledge-base/clients/102039-import-your-existing-client-list",
      "https://www.fresha.com/help-center/knowledge-base/reports/432-data-connector-overview",
    ],
    entities: [
      csv("clients", [
        "Partners → Clients → Options → Import clients (use their template as export reference), or export client list CSV from Reports.",
        "Include email and mobile so Liv can recognise returning guests.",
      ]),
      csv("services", [
        "No single public bulk export — screenshot your service list or export via Data connector (paid) if you have it.",
        "Paste any CSV with service name, duration, price — or share your Fresha booking link and I'll mirror the menu.",
      ], "Data connector Snowflake tables: services, bookings, clients"),
      csv("appointments", [
        "Calendar → export or Data connector bookings table for upcoming appointments.",
      ]),
      unavailable("staff", "manual_entry", ["Add team under Staff after menu import, or paste a roster CSV with names and emails."]),
    ],
  },
  {
    id: "booksy",
    displayName: "Booksy",
    verticals: ["hair", "beauty", "body-art"],
    regions: ["US", "IE", "GB", "PL"],
    tier: "tier1_heartland",
    livStatus: "csv_plus_guide",
    legacyBrokerId: "booksy",
    selfServeMinutesEstimate: { min: 20, max: 60 },
    parallelRunRecommended: false,
    pickerSubtitle: "Barber & beauty — request CSV via support chat",
    livIntro: "Booksy doesn't offer a self-serve export button — open Help → Support and ask for your client list as CSV. While you wait, paste anything you have; I'll still set up your booking page.",
    referenceUrls: ["https://support.bookedin.com/hc/en-us/articles/4808208961300"],
    entities: [
      {
        kind: "clients",
        available: true,
        method: "support_request",
        ownerSteps: [
          "Booksy Biz (desktop) → ? → Support → ask for client list CSV.",
          "Download from chat when the agent sends it.",
          "Paste into Livia below.",
        ],
        livPath: "booksy_legacy",
      },
      {
        kind: "appointments",
        available: true,
        method: "support_request",
        ownerSteps: ["In the same support chat, ask for upcoming appointments CSV."],
        livPath: "universal_csv",
      },
      {
        kind: "services",
        available: true,
        method: "public_booking_page",
        ownerSteps: [
          "Share your public Booksy booking URL — Liv can mirror services from your live menu.",
          "Or type your top services manually in the menu step.",
        ],
        livPath: "concierge",
      },
      unavailable("staff", "manual_entry", ["List staff names and emails in Team after import."]),
    ],
  },
  {
    id: "acuity",
    displayName: "Acuity Scheduling",
    verticals: ["wellness", "allied-health", "beauty"],
    regions: ["US", "GB", "IE", "EU"],
    tier: "tier2_common",
    livStatus: "oauth_planned",
    legacyBrokerId: "acuity",
    oauthBrokerId: "migration_acuity",
    selfServeMinutesEstimate: { min: 10, max: 25 },
    parallelRunRecommended: false,
    pickerSubtitle: "Solo & consult — excellent CSV exports",
    livIntro: "Acuity's exports are owner-friendly. Pull clients and appointments from Reports — they map directly into Livia.",
    referenceUrls: [
      "https://help.acuityscheduling.com/hc/en-us/articles/16676916553485",
      "https://developers.acuityscheduling.com/",
    ],
    entities: [
      csv("clients", ["Clients → Import/export → Export client list → CSV."]),
      csv("services", ["Appointment types map to services — export appointments CSV includes type, duration, price."]),
      csv("appointments", [
        "Reports → Import/Export → pick date range → Export appointments CSV.",
        "Include upcoming dates for a smooth cutover.",
      ]),
      csv("staff", ["Calendar column in appointments export identifies providers; optional staff CSV with names."]),
    ],
  },
  {
    id: "square_appointments",
    displayName: "Square Appointments",
    verticals: ["hair", "beauty", "wellness"],
    regions: ["US", "IE", "GB", "AU"],
    tier: "tier2_common",
    livStatus: "oauth_planned",
    legacyBrokerId: "square",
    oauthBrokerId: "migration_square",
    selfServeMinutesEstimate: { min: 15, max: 30 },
    parallelRunRecommended: false,
    pickerSubtitle: "Square seller — OAuth Bookings + Catalog API",
    livIntro: "Square has a proper API for bookings, catalog, and team. Connect when available, or export clients and appointments from Square Dashboard reports meanwhile.",
    referenceUrls: ["https://developer.squareup.com/docs/bookings-api/what-it-is"],
    entities: [
      {
        kind: "appointments",
        available: true,
        method: "oauth_api",
        ownerSteps: ["Connect Square (Settings → Integrations) when enabled — Liv pulls bookings and catalog."],
        livPath: "broker_oauth",
      },
      csv("clients", ["Square Dashboard → Customers → Export (or Reports → Client list)."]),
      csv("services", ["Square Catalog → export or connect OAuth for service variations and durations."]),
      csv("staff", ["Square Team → export team member list where available."]),
    ],
  },
  {
    id: "vagaro",
    displayName: "Vagaro",
    verticals: ["hair", "beauty", "medspa"],
    regions: ["US", "CA"],
    tier: "tier2_common",
    livStatus: "oauth_stub",
    legacyBrokerId: "vagaro",
    selfServeMinutesEstimate: { min: 15, max: 30 },
    parallelRunRecommended: true,
    pickerSubtitle: "US salon — Reports CSV + forward-only API",
    livIntro: "Export your customer list from Reports — owner-only. Vagaro's API is forward-looking; we'll import history from CSV and use Liv for new bookings.",
    referenceUrls: [
      "https://support.vagaro.com/hc/en-us/articles/360006371094",
      "https://docs.vagaro.com/public/docs/webhook-events",
    ],
    entities: [
      csv("clients", ["Reports → Customers → Run Report → Export Excel/CSV (owner only)."]),
      unavailable("appointments", "in_app_report", ["Use appointment reports — export CSV from Reports section for date range."]),
      unavailable("services", "manual_entry", ["Mirror from your Vagaro booking page or enter in Livia menu step."]),
      unavailable("staff", "manual_entry", ["Add providers under Team after import."]),
    ],
  },
  {
    id: "mindbody",
    displayName: "Mindbody",
    verticals: ["fitness", "wellness"],
    regions: ["US", "GB", "AU"],
    tier: "tier2_common",
    livStatus: "oauth_stub",
    legacyBrokerId: "mindbody",
    selfServeMinutesEstimate: { min: 30, max: 90 },
    parallelRunRecommended: true,
    pickerSubtitle: "Fitness & studio — API partner or data export on exit",
    livIntro: "Mindbody is deeper — class schedules and memberships need a careful cutover. CSV for clients and upcoming visits first; parallel run recommended for studios.",
    referenceUrls: ["https://developers.mindbodyonline.com/"],
    entities: [
      csv("clients", ["Mindbody → Clients → export or request data export from support for full history."]),
      csv("appointments", ["Reports → appointment details for forward bookings; class rosters separate."]),
      unavailable("services", "in_app_report", ["Export service/class list from Mindbody reports or site settings."]),
      csv("staff", ["Staff list export from Mindbody manager tools where available."]),
    ],
  },
  {
    id: "timely_salon",
    displayName: "Timely (salon)",
    verticals: ["hair", "beauty"],
    regions: ["AU", "NZ", "GB", "IE"],
    tier: "tier2_common",
    livStatus: "csv_plus_guide",
    legacyBrokerId: "timely",
    selfServeMinutesEstimate: { min: 15, max: 40 },
    parallelRunRecommended: false,
    pickerSubtitle: "GetTimely / salon — Reports CSV",
    livIntro: "Timely's Reports section gives you clients and appointment schedules as CSV. Services come from your booking page if there's no export.",
    referenceUrls: ["https://support.heygoldie.com/en/articles/323744-importing-from-timely"],
    entities: [
      csv("clients", ["Timely App → Reports → Customer List → CSV."]),
      csv("appointments", ["Reports → Appointment Schedule → set date range → View Report → CSV."]),
      {
        kind: "services",
        available: true,
        method: "public_booking_page",
        ownerSteps: ["Share your Timely booking page URL — we'll mirror services from there."],
        livPath: "concierge",
      },
      unavailable("staff", "manual_entry", ["Email staff names or add under Team in Livia."]),
    ],
  },
  {
    id: "treatwell",
    displayName: "Treatwell",
    verticals: ["hair", "beauty", "wellness"],
    regions: ["GB", "IE", "EU"],
    tier: "tier3_adjacent",
    livStatus: "csv_plus_guide",
    legacyBrokerId: "treatwell",
    selfServeMinutesEstimate: { min: 25, max: 60 },
    parallelRunRecommended: true,
    pickerSubtitle: "Marketplace — partner reports + client CSV",
    livIntro: "Treatwell mixes marketplace bookings with your diary. Export what Treatwell allows from partner tools — we'll bring clients and forward bookings across.",
    entities: [
      csv("clients", ["Treatwell Partner → clients / CRM export where available, or request CSV from partner support."]),
      csv("appointments", ["Diary export or partner reports for upcoming appointments."]),
      unavailable("services", "manual_entry", ["Mirror menu from Treatwell profile or enter in Livia."]),
      unavailable("staff", "manual_entry", ["Add team in Livia after menu setup."]),
    ],
  },
  {
    id: "calendly",
    displayName: "Calendly",
    verticals: ["wellness", "allied-health", "hair"],
    regions: ["global"],
    tier: "tier3_adjacent",
    livStatus: "csv_plus_guide",
    selfServeMinutesEstimate: { min: 10, max: 20 },
    parallelRunRecommended: false,
    pickerSubtitle: "Solo scheduling — event export + Google Calendar",
    livIntro: "Calendly pairs well with a clean start: export scheduled events, connect Google Calendar if you use it, and Liv takes over new bookings on your Livia link.",
    entities: [
      csv("appointments", ["Calendly → Scheduled Events → export CSV for upcoming events."]),
      unavailable("clients", "manual_entry", ["Invitees appear in event export — Liv creates client records from that."]),
      unavailable("services", "manual_entry", ["Event types become your Livia service menu — add durations and prices in menu step."]),
      unavailable("staff", "manual_entry", ["Solo — you're already on the team."]),
    ],
  },
  {
    id: "google_calendar",
    displayName: "Google Calendar",
    verticals: ["hair", "beauty", "wellness", "allied-health"],
    regions: ["global"],
    tier: "tier3_adjacent",
    livStatus: "oauth_planned",
    legacyBrokerId: "google_calendar",
    oauthBrokerId: "calendar_google",
    selfServeMinutesEstimate: { min: 5, max: 15 },
    parallelRunRecommended: false,
    pickerSubtitle: "Paper-adjacent solo — calendar pull",
    livIntro: "If your diary lives in Google Calendar, connect it and Liv can read upcoming events while you build your proper menu.",
    entities: [
      {
        kind: "appointments",
        available: true,
        method: "oauth_api",
        ownerSteps: ["Settings → Integrations → Connect Google Calendar."],
        livPath: "broker_oauth",
      },
      unavailable("clients", "manual_entry", ["Client names from calendar event titles — full CRM import optional later."]),
      unavailable("services", "manual_entry", ["Confirm service menu in Livia — calendar doesn't carry prices."]),
      unavailable("staff", "manual_entry", ["Solo default — invite team later if needed."]),
    ],
  },
  {
    id: "spreadsheet",
    displayName: "Spreadsheet or paper",
    verticals: ["hair", "beauty", "body-art", "wellness", "fitness", "medspa", "allied-health", "pet-grooming", "automotive-detailing", "event-vendors"],
    regions: ["global"],
    tier: "tier3_adjacent",
    livStatus: "csv_self_serve",
    selfServeMinutesEstimate: { min: 10, max: 30 },
    parallelRunRecommended: false,
    pickerSubtitle: "Excel, Notes, or a list you already have",
    livIntro: "No problem — paste any CSV or type your top services. Many solo owners start clean and let Liv build the record from day one.",
    entities: [
      csv("clients", ["Paste names, phones, emails — one client per row."]),
      csv("services", ["Paste service name, duration, price columns."]),
      csv("appointments", ["Optional — upcoming dates and times if you track them in a sheet."]),
      csv("staff", ["Optional — names and emails; solo owners can skip."]),
    ],
  },
  ...INCUMBENT_MIGRATION_EXTENDED,
];

export const MIGRATION_SOURCE_IDS = INCUMBENT_MIGRATION_SOURCES.map((s) => s.id);

export type MigrationSourceId = (typeof MIGRATION_SOURCE_IDS)[number];

export function getMigrationSource(id: string): IncumbentMigrationSource | undefined {
  return INCUMBENT_MIGRATION_SOURCES.find((s) => s.id === id);
}

export function listMigrationSourcesForVertical(
  vertical?: string | null,
): IncumbentMigrationSource[] {
  if (!vertical) return INCUMBENT_MIGRATION_SOURCES;
  const matched = INCUMBENT_MIGRATION_SOURCES.filter((s) =>
    s.verticals.includes(vertical as BusinessVertical),
  );
  const generic = INCUMBENT_MIGRATION_SOURCES.filter((s) => s.id === "spreadsheet");
  const ids = new Set<string>();
  return [...matched, ...INCUMBENT_MIGRATION_SOURCES.filter((s) => s.tier !== "tier3_adjacent"), ...generic].filter(
    (s) => {
      if (ids.has(s.id)) return false;
      ids.add(s.id);
      return true;
    },
  );
}

export function resolveMigrationLivWalkthrough(sourceId: string): {
  intro: string;
  steps: Array<{ label: string; detail: string; entity?: MigrationEntityKind }>;
} {
  const source = getMigrationSource(sourceId) ?? getMigrationSource("spreadsheet")!;
  const steps = source.entities
    .filter((e) => e.available)
    .flatMap((e) =>
      e.ownerSteps.map((detail, i) => ({
        label: i === 0 ? entityLabel(e.kind) : `Continue — ${entityLabel(e.kind)}`,
        detail,
        entity: e.kind,
      })),
    );
  return { intro: source.livIntro, steps };
}

function entityLabel(kind: MigrationEntityKind): string {
  const labels: Record<MigrationEntityKind, string> = {
    clients: "Client list",
    services: "Service menu",
    staff: "Team",
    appointments: "Upcoming appointments",
    hours: "Opening hours",
    products: "Retail products",
  };
  return labels[kind];
}

/** Platforms with live or near-live OAuth path (engineering priority). */
export function migrationOAuthPriorityIds(): string[] {
  return INCUMBENT_MIGRATION_SOURCES.filter(
    (s) =>
      s.livStatus === "oauth_planned" ||
      s.livStatus === "oauth_stub" ||
      s.livStatus === "oauth_live" ||
      Boolean(s.oauthBrokerId),
  )
    .sort((a, b) => (a.tier === "tier1_heartland" ? -1 : 1))
    .map((s) => s.id);
}
