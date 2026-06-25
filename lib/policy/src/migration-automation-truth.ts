/**
 * Factual automation status per incumbent — what Livia can connect today vs file-only.
 * UI must not promise OAuth/partner ingest when tier is not `oauth_live`.
 */
import {
  getMigrationSource,
  type IncumbentMigrationSource,
} from "./incumbent-migration-atlas";
import { migrationOAuthBrokerForIncumbent } from "./migration-oauth-program";
import { migrationPartnerBrokerForIncumbent } from "./migration-partner-program";

export type MigrationAutomationTier =
  | "oauth_live"
  | "partner_live"
  | "oauth_not_configured"
  | "partner_not_built"
  | "file_only"
  | "manual_only";

export type MigrationAutomationTruth = {
  tier: MigrationAutomationTier;
  /** Primary owner action label */
  primaryCta: string;
  /** Plain-language ceiling — what we cannot automate */
  honestLimit: string;
  showConnectButton: boolean;
  showFileUpload: boolean;
  /** One line under the source name */
  statusLine: string;
};

function entityAutoLabels(source: IncumbentMigrationSource): string[] {
  const labels: Record<string, string> = {
    clients: "clients",
    services: "menu",
    staff: "team",
    appointments: "bookings",
    hours: "hours",
    products: "retail",
  };
  return source.entities
    .filter(
      (e) =>
        e.available &&
        (e.method === "oauth_api" ||
          e.method === "partner_api" ||
          e.livPath === "broker_oauth"),
    )
    .map((e) => labels[e.kind] ?? e.kind);
}

function fileEntityLabels(source: IncumbentMigrationSource): string[] {
  const labels: Record<string, string> = {
    clients: "clients",
    services: "menu",
    staff: "team",
    appointments: "bookings",
  };
  return source.entities
    .filter(
      (e) =>
        e.available &&
        (e.method === "self_serve_csv" ||
          e.method === "self_serve_excel" ||
          e.method === "in_app_report" ||
          e.method === "support_request" ||
          e.livPath === "universal_csv" ||
          e.livPath === "magic_setup"),
    )
    .map((e) => labels[e.kind] ?? e.kind);
}

function manualEntityLabels(source: IncumbentMigrationSource): string[] {
  return source.entities
    .filter((e) => !e.available || e.method === "manual_entry")
    .map((e) => e.kind);
}

export function resolveMigrationAutomationTruth(
  sourceId: string,
  runtime: {
    oauthLive?: boolean;
    oauthConnected?: boolean;
    partnerLive?: boolean;
  } = {},
): MigrationAutomationTruth | null {
  const source = getMigrationSource(sourceId);
  if (!source) return null;

  const brokerId = migrationOAuthBrokerForIncumbent(source.id);
  const partnerBrokerId = migrationPartnerBrokerForIncumbent(source.id);
  const autoKinds = entityAutoLabels(source);
  const fileKinds = fileEntityLabels(source);
  const manualKinds = manualEntityLabels(source);

  if (brokerId) {
    if (runtime.oauthLive) {
      const limit =
        manualKinds.length > 0
          ? `Cannot auto-import: ${manualKinds.join(", ")}. Add those in Livia after connect.`
          : "Pulls what their API exposes — historic depth varies by account.";
      return {
        tier: "oauth_live",
        primaryCta: runtime.oauthConnected ? "Import into Livia" : "Connect & import",
        honestLimit: limit,
        showConnectButton: true,
        showFileUpload: true,
        statusLine: `Direct connect available · auto: ${autoKinds.join(", ") || "see connect"}`,
      };
    }
    return {
      tier: "oauth_not_configured",
      primaryCta: "Connect & import",
      honestLimit:
        "Direct connect is not enabled on this workspace yet. Upload exports below — same pipeline.",
      showConnectButton: false,
      showFileUpload: true,
      statusLine: "Connect rolling out · file upload works now",
    };
  }

  if (partnerBrokerId) {
    if (runtime.partnerLive) {
      return {
        tier: "partner_live",
        primaryCta: "Import from partner API",
        honestLimit:
          manualKinds.length > 0
            ? `Partner API: ${autoKinds.join(", ") || "clients, services, bookings"}. Cannot auto: ${manualKinds.join(", ")}.`
            : "Pulls what the partner API exposes for your salon ID.",
        showConnectButton: true,
        showFileUpload: true,
        statusLine: "Partner API available",
      };
    }
    return {
      tier: "partner_not_built",
      primaryCta: "Save salon ID",
      honestLimit:
        source.livStatus === "partner_required"
          ? "Partner credentials are not on this workspace. Upload CSV exports today."
          : "Partner import not available. Use file upload.",
      showConnectButton: false,
      showFileUpload: true,
      statusLine: "Partner API not configured · file upload works",
    };
  }

  if (source.id === "spreadsheet") {
    return {
      tier: "file_only",
      primaryCta: "Upload files",
      honestLimit: "No external system to connect — upload whatever lists you have.",
      showConnectButton: false,
      showFileUpload: true,
      statusLine: "File upload only",
    };
  }

  const hasFile = fileKinds.length > 0;
  if (hasFile) {
    const supportOnly = source.entities.some((e) => e.method === "support_request");
    return {
      tier: "file_only",
      primaryCta: "Upload exports",
      honestLimit: supportOnly
        ? "This platform has no connect API. Request CSV from their support, then upload here."
        : "No connect API for this platform. Export from your account, then upload files.",
      showConnectButton: false,
      showFileUpload: true,
      statusLine: `File only: ${fileKinds.join(", ")}`,
    };
  }

  return {
    tier: "manual_only",
    primaryCta: "Continue setup in Livia",
    honestLimit: "Nothing to import automatically. Set up menu and clients in the app.",
    showConnectButton: false,
    showFileUpload: false,
    statusLine: "Manual setup",
  };
}
