#!/usr/bin/env node
/**
 * Prints the canonical Railway production env checklist.
 * Railway does NOT sync from git — use this after refactors to clean the dashboard.
 */
const REQUIRED = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "DASHBOARD_URL",
  "MARKETING_URL",
  "API_PUBLIC_URL",
  "CORS_ALLOWED_ORIGINS",
  "INTERNAL_OPS_SECRET",
];

const OPTIONAL = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "ANTHROPIC_API_KEY",
  "INNGEST_EVENT_KEY",
  "INNGEST_SIGNING_KEY",
  "SENTRY_DSN_API",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
];

const DELETE_FROM_RAILWAY = [
  "DASHBOARD_BASE_URL",
  "DASHBOARD_PUBLIC_URL",
  "TENANT_DASHBOARD_URL",
  "LIVIA_DASHBOARD_URL",
  "MARKETING_PUBLIC_URL",
  "INTERNAL_PUBLIC_URL",
  "PUBLIC_BASE_URL",
  "CLERK_PROXY_URL",
  "LIVIA_MARKETING_URL",
  "GRAFANA_EMBED_BASE_URL",
  "GRAFANA_LOCAL_URL",
  "INTERNAL_GRAFANA_URL",
  "LOKI_QUERY_BASE_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
];

console.log("=== Railway (livia-api) — set these ===\n");
for (const k of REQUIRED) console.log(k);

console.log("\n=== Optional integrations ===\n");
for (const k of OPTIONAL) console.log(`# ${k}`);

console.log("\n=== Safe to DELETE from Railway (legacy) ===\n");
for (const k of DELETE_FROM_RAILWAY) console.log(k);

console.log("\nTemplate: railway.env.example");
console.log("Docs: docs/operations/ENV-VARIABLES.md");
console.log("\nRailway does not auto-remove vars when you delete them from the repo.\n");
