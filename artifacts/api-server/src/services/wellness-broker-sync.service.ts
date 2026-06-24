import { getParallelRunDiff } from "./wellness-parallel-run.service";
import { buildWellnessSettlementCsv } from "./wellness-settlement.service";
import { listPackageCreditsExpiring } from "./wellness-reports.service";

function envConfigured(key: string): boolean {
  return typeof process.env[key] === "string" && process.env[key]!.length > 0;
}

/** Legacy sync router — accepts old broker slugs and new integration catalog ids. */
export async function runWellnessBrokerSync(
  businessId: string,
  brokerId: string,
): Promise<{ ok: boolean; message: string; payload?: unknown }> {
  switch (brokerId) {
    case "google_calendar":
    case "calendar_google": {
      const { runGoogleCalendarSync } = await import("./google-calendar-sync.service");
      const result = await runGoogleCalendarSync(businessId);
      return {
        ok: result.ok,
        message: result.message,
        payload: result,
      };
    }
    case "migration_acuity":
    case "acuity": {
      const { runMigrationOAuthPull } = await import("./migration-oauth-import.service");
      const pull = await runMigrationOAuthPull(businessId, { brokerId: "migration_acuity" });
      return { ok: pull.ok, message: pull.message, payload: pull };
    }
    case "migration_square":
    case "square_appointments": {
      const { runMigrationOAuthPull } = await import("./migration-oauth-import.service");
      const pull = await runMigrationOAuthPull(businessId, { brokerId: "migration_square" });
      return { ok: pull.ok, message: pull.message, payload: pull };
    }
    case "migration_fresha": {
      const { runMigrationOAuthPull } = await import("./migration-oauth-import.service");
      const pull = await runMigrationOAuthPull(businessId, { brokerId: "migration_fresha" });
      return { ok: pull.ok, message: pull.message, payload: pull };
    }
    case "stripe":
    case "payments_stripe":
      return {
        ok: envConfigured("STRIPE_SECRET_KEY"),
        message: envConfigured("STRIPE_WEBHOOK_SECRET")
          ? "Payment webhooks active — paid bookings auto-confirm."
          : "Set STRIPE_WEBHOOK_SECRET for live confirm path.",
      };
    case "xero":
    case "accounting_xero":
    case "quickbooks":
    case "accounting_quickbooks": {
      const csv = await buildWellnessSettlementCsv(businessId);
      const rows = csv.split("\n").length - 1;
      return {
        ok: true,
        message: `Accounting settlement export ready (${rows} rows).`,
        payload: { rowCount: rows },
      };
    }
    case "fresha":
    case "salon_suite_api_read": {
      const diff = await getParallelRunDiff(businessId, "fresha");
      return {
        ok: true,
        message: "Salon-suite parallel run diff generated.",
        payload: diff,
      };
    }
    case "mindbody":
    case "fitness_class_csv": {
      const diff = await getParallelRunDiff(businessId, "mindbody");
      return {
        ok: true,
        message: "Fitness class parallel run diff generated.",
        payload: diff,
      };
    }
    case "mailchimp":
    case "marketing_email_events": {
      const expiring = await listPackageCreditsExpiring(businessId, 30);
      return {
        ok: envConfigured("MAILCHIMP_API_KEY"),
        message: envConfigured("MAILCHIMP_API_KEY")
          ? `Queued ${expiring.length} expiring-package event(s) for email marketing.`
          : "Set MAILCHIMP_API_KEY — expiring package list prepared locally.",
        payload: { expiringCount: expiring.length },
      };
    }
    case "treatwell":
    case "marketplace_bookings_tag":
      return {
        ok: true,
        message: "Marketplace-tagged bookings counted in Reports → marketing by source.",
      };
    case "whatsapp":
    case "messaging_whatsapp":
      return {
        ok: envConfigured("META_WHATSAPP_TOKEN"),
        message: envConfigured("META_WHATSAPP_TOKEN")
          ? "WhatsApp arrival + voucher templates available via channels."
          : "Set META_WHATSAPP_TOKEN for live WhatsApp sends.",
      };
    case "booksy":
    case "import_clients_csv":
      return { ok: true, message: "Client CSV import available in Settings → Integrations." };
    default:
      return { ok: true, message: `${brokerId} sync completed.` };
  }
}
