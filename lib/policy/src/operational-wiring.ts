/** Entitlements shown in billing UI but not yet executable in product — honest labels. */
export const PLANNED_ENTITLEMENTS = new Set([
  "apple_wallet_passes",
  "google_calendar_export",
  "stripe_connect_payouts",
  "phorest_migration_broker",
]);

/** Brokers that only support CSV export today (not live OAuth). */
export const CSV_ONLY_BROKER_IDS = new Set(["xero", "quickbooks", "mindbody"]);
