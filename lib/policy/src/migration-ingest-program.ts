/**
 * Migration ingest profiles — what each incumbent can automate vs file vs manual.
 * Hub for onboarding import UI (featured picker, search, connection fields).
 */
import type { ImportEntityKind } from "./import-formats";
import {
  getMigrationSource,
  listMigrationSourcesForVertical,
  type IncumbentMigrationSource,
  type MigrationEntityExport,
  type MigrationEntityKind,
} from "./incumbent-migration-atlas";
import { migrationOAuthBrokerForIncumbent } from "./migration-oauth-program";

export type MigrationIngestMode =
  | "oauth"
  | "partner_api"
  | "file_upload"
  | "booking_url"
  | "manual";

export type MigrationConnectionFieldId =
  | "booking_url"
  | "business_slug"
  | "salon_id"
  | "account_email";

export type MigrationConnectionField = {
  id: MigrationConnectionFieldId;
  label: string;
  placeholder: string;
  help: string;
};

export type MigrationEntityIngestStatus = {
  kind: MigrationEntityKind;
  label: string;
  /** Livia can pull via OAuth/partner API when configured */
  automated: boolean;
  /** Owner can upload a file */
  file: boolean;
  /** Manual entry or Liv assist in-app */
  manual: boolean;
  /** Not realistically available from this platform */
  unavailable: boolean;
};

export type MigrationIngestProfile = {
  sourceId: string;
  displayName: string;
  primaryMode: MigrationIngestMode;
  /** Short owner-facing summary */
  headline: string;
  oauthBrokerId: ReturnType<typeof migrationOAuthBrokerForIncumbent>;
  entities: MigrationEntityIngestStatus[];
  connectionFields: MigrationConnectionField[];
  /** Entity kinds OAuth pull targets when live */
  oauthPullKinds: ImportEntityKind[];
};

const ENTITY_LABELS: Record<MigrationEntityKind, string> = {
  clients: "Clients",
  services: "Service menu",
  staff: "Team",
  appointments: "Upcoming bookings",
  hours: "Opening hours",
  products: "Retail products",
};

function entityIngestStatus(exp: MigrationEntityExport): MigrationEntityIngestStatus {
  const automated =
    exp.available &&
    (exp.method === "oauth_api" || exp.method === "partner_api" || exp.livPath === "broker_oauth");
  const file =
    exp.available &&
    (exp.method === "self_serve_csv" ||
      exp.method === "self_serve_excel" ||
      exp.method === "in_app_report" ||
      exp.method === "support_request" ||
      exp.method === "privacy_export" ||
      exp.livPath === "universal_csv" ||
      exp.livPath === "magic_setup" ||
      exp.livPath === "booksy_legacy");
  const manual =
    exp.available && (exp.method === "manual_entry" || exp.livPath === "manual_entry");
  const unavailable = !exp.available;
  return {
    kind: exp.kind,
    label: ENTITY_LABELS[exp.kind],
    automated,
    file,
    manual,
    unavailable,
  };
}

function resolvePrimaryMode(source: IncumbentMigrationSource): MigrationIngestMode {
  if (source.oauthBrokerId) return "oauth";
  if (source.livStatus === "partner_required") return "partner_api";
  if (source.entities.some((e) => e.livPath === "concierge" || e.method === "public_booking_page")) {
    return "booking_url";
  }
  if (
    source.entities.some(
      (e) =>
        e.method === "self_serve_csv" ||
        e.method === "self_serve_excel" ||
        e.livPath === "universal_csv" ||
        e.livPath === "magic_setup",
    )
  ) {
    return "file_upload";
  }
  void source;
  return "file_upload";
}

function resolveHeadline(source: IncumbentMigrationSource, mode: MigrationIngestMode): string {
  if (mode === "oauth") {
    return "Connect once — Livia pulls clients, menu, and bookings automatically.";
  }
  if (mode === "partner_api") {
    return "Partner import — we need your salon ID, then Livia ingests when the link is live.";
  }
  if (mode === "booking_url") {
    return "Paste your public booking link — Liv mirrors your menu, then you upload clients.";
  }
  return "Upload exports from your old system — Livia maps them in one pass.";
}

function resolveConnectionFields(source: IncumbentMigrationSource): MigrationConnectionField[] {
  if (source.oauthBrokerId) return [];
  if (source.livStatus === "partner_required") {
    return [
      {
        id: "salon_id",
        label: "Salon or business ID",
        placeholder: "From your account settings",
        help: "Stored for partner ingest. Upload files below until direct connect is live.",
      },
    ];
  }
  if (source.entities.some((e) => e.livPath === "concierge" || e.method === "public_booking_page")) {
    return [
      {
        id: "booking_url",
        label: "Public booking link",
        placeholder: "https://…",
        help: "Liv reads your live menu from this page.",
      },
    ];
  }
  return [];
}

export function resolveMigrationIngestProfile(sourceId: string): MigrationIngestProfile | null {
  const source = getMigrationSource(sourceId);
  if (!source) return null;
  const primaryMode = resolvePrimaryMode(source);
  const oauthBrokerId = migrationOAuthBrokerForIncumbent(source.id);
  const brokerEntities = oauthBrokerId
    ? (["clients", "services", "appointments", "staff"] as ImportEntityKind[]).filter((k) =>
        source.entities.some((e) => e.kind === k && e.available),
      )
    : [];
  return {
    sourceId: source.id,
    displayName: source.displayName,
    primaryMode,
    headline: resolveHeadline(source, primaryMode),
    oauthBrokerId,
    entities: source.entities.map(entityIngestStatus),
    connectionFields: resolveConnectionFields(source),
    oauthPullKinds: brokerEntities,
  };
}

/** Top N heartland incumbents for the vertical — not the full grid. */
export function listFeaturedMigrationSources(
  vertical?: string | null,
  limit = 5,
): IncumbentMigrationSource[] {
  const pool = listMigrationSourcesForVertical(vertical).filter((s) => s.id !== "spreadsheet");
  const tier1 = pool.filter((s) => s.tier === "tier1_heartland");
  const picked: IncumbentMigrationSource[] = [];
  const seen = new Set<string>();
  for (const s of [...tier1, ...pool]) {
    if (picked.length >= limit) break;
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    picked.push(s);
  }
  return picked;
}

export function searchMigrationSources(
  query: string,
  vertical?: string | null,
): IncumbentMigrationSource[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return listMigrationSourcesForVertical(vertical)
    .filter(
      (s) =>
        s.displayName.toLowerCase().includes(q) ||
        s.pickerSubtitle.toLowerCase().includes(q) ||
        s.id.includes(q),
    )
    .slice(0, 10);
}

/** Compact capability line for picker cards */
export function migrationIngestCapabilityLine(sourceId: string): string {
  const profile = resolveMigrationIngestProfile(sourceId);
  if (!profile) return "";
  const auto = profile.entities.filter((e) => e.automated).map((e) => e.label);
  const file = profile.entities.filter((e) => e.file && !e.automated).map((e) => e.label);
  const parts: string[] = [];
  if (profile.oauthBrokerId) parts.push("Direct connect");
  if (auto.length) parts.push(`Auto: ${auto.join(", ")}`);
  if (file.length) parts.push(`File: ${file.join(", ")}`);
  const blocked = profile.entities.filter((e) => e.unavailable).map((e) => e.label);
  if (blocked.length) parts.push(`Not from export: ${blocked.join(", ")}`);
  return parts.join(" · ");
}
