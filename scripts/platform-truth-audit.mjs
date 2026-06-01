#!/usr/bin/env node
/**
 * Platform truth audit — catches UI/docs that imply execution without backend wiring.
 * Run: node scripts/platform-truth-audit.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const api = join(root, "artifacts/api-server/src");

const checks = [
  {
    id: "mandate-gated-tools",
    label: "Liv tools gated through mandate before execution",
    pass: () => {
      const s = readFileSync(join(api, "services/mandate-gated-tool.service.ts"), "utf8");
      return s.includes("send_message") && s.includes("reply_inbox");
    },
  },
  {
    id: "operational-cache",
    label: "Dashboard cross-surface cache invalidation",
    pass: () =>
      existsSync(join(root, "artifacts/livia-dashboard/src/lib/operational-cache.ts")) &&
      existsSync(join(root, "artifacts/livia-mobile/lib/operational-cache.ts")),
  },
  {
    id: "proposal-executor",
    label: "Liv proposal approve executes side effects",
    pass: () =>
      existsSync(join(api, "services/proposal-executor.service.ts")) &&
      readFileSync(join(api, "services/liv-mandate.service.ts"), "utf8").includes(
        "executeApprovedProposal",
      ),
  },
  {
    id: "conversation-resolve",
    label: "Inbox case resolve API (not status-only close)",
    pass: () =>
      existsSync(join(api, "services/conversation-case.service.ts")) &&
      readFileSync(join(api, "routes/conversations.ts"), "utf8").includes("/resolve"),
  },
  {
    id: "refund-ledger",
    label: "Refund ledger service",
    pass: () => existsSync(join(api, "services/refund.service.ts")),
  },
  {
    id: "payments-ledger",
    label: "Payments ledger + stripe event idempotency",
    pass: () =>
      existsSync(join(root, "lib/db/migrations/sql/025-production-payments.sql")) &&
      existsSync(join(api, "services/payment.service.ts")) &&
      existsSync(join(api, "services/stripe-events.service.ts")),
  },
  {
    id: "payments-routes",
    label: "Payments API routes (payment intent + refund)",
    pass: () =>
      existsSync(join(api, "routes/payments.ts")) &&
      readFileSync(join(api, "routes/index.ts"), "utf8").includes("paymentsRouter"),
  },
  {
    id: "shift-templates",
    label: "Shift templates + publish week",
    pass: () =>
      existsSync(join(api, "services/shift-templates.service.ts")) &&
      readFileSync(join(api, "services/slots.service.ts"), "utf8").includes("staffShiftsTable"),
  },
  {
    id: "staff-assign",
    label: "Rule-based staff assignment on booking create",
    pass: () =>
      existsSync(join(api, "services/staff-assign.service.ts")) &&
      readFileSync(join(api, "services/bookings.service.ts"), "utf8").includes(
        "assignStaffForBooking",
      ),
  },
  {
    id: "refund-ladder-workflow",
    label: "Refund ladder Inngest workflow",
    pass: () => existsSync(join(api, "workflows/refund-ladder.ts")),
  },
  {
    id: "demo-sean-linked",
    label: "Demo Sean Kelly thread linked to booking",
    pass: () =>
      readFileSync(join(api, "services/demo-inbox.seed.ts"), "utf8").includes("sean_today") &&
      readFileSync(join(api, "services/demo-inbox.seed.ts"), "utf8").includes("linkedBookingKey"),
  },
  {
    id: "waitlist-on-cancel",
    label: "Waitlist offer workflow on booking.cancelled",
    pass: () =>
      readFileSync(join(api, "workflows/waitlist-offer.ts"), "utf8").includes("booking.cancelled"),
  },
  {
    id: "waitlist-yes-inbound",
    label: "Waitlist SMS YES inbound parser",
    pass: () =>
      existsSync(join(api, "services/waitlist-inbound.service.ts")) &&
      readFileSync(join(api, "routes/sms-webhook.ts"), "utf8").includes(
        "tryAcceptWaitlistOfferFromSms",
      ),
  },
  {
    id: "package-credit-burn",
    label: "Package credits burn on booking create",
    pass: () =>
      readFileSync(join(api, "services/bookings.service.ts"), "utf8").includes("burnPackageCredit"),
  },
  {
    id: "rota-templates-ui",
    label: "Rota page wired to shift templates API",
    pass: () =>
      readFileSync(join(root, "artifacts/livia-dashboard/src/pages/rota.tsx"), "utf8").includes(
        "shift-templates/materialize",
      ),
  },
  {
    id: "tenant-experience-api",
    label: "GET /me/tenant-experience + policy resolver",
    pass: () =>
      existsSync(join(api, "services/tenant-experience.service.ts")) &&
      readFileSync(join(api, "routes/me.ts"), "utf8").includes("/me/tenant-experience"),
  },
  {
    id: "mobile-onboarding-catalog",
    label: "Mobile onboarding fetches /onboarding/catalog",
    pass: () =>
      readFileSync(
        join(root, "artifacts/livia-mobile/lib/onboarding-catalog.ts"),
        "utf8",
      ).includes("/api/onboarding/catalog"),
  },
  {
    id: "mobile-blocking-onboarding",
    label: "Mobile completes blocking gates natively",
    pass: () =>
      existsSync(join(root, "artifacts/livia-mobile/app/onboarding-setup.tsx")) &&
      readFileSync(
        join(root, "artifacts/livia-mobile/lib/onboarding-blocking.ts"),
        "utf8",
      ).includes("completeBlockingAct"),
  },
];

/** Known hollow areas — must stay listed until implemented (honesty gate). */
const knownHollow = [
  "Stripe Connect split payouts / Connect accounts (ledger is real; Connect onboarding still optional)",
  "Integration OAuth brokers live sync (Fresha/Square registry + env keys only)",
  "Staff-borrow / partner-vote workflows (log-only scaffolds)",
  "Apple Wallet / Google Calendar export entitlements (marked planned in billing UI)",
];

let failed = 0;
console.log("\n══ Platform truth audit ══\n");
for (const c of checks) {
  const ok = c.pass();
  console.log(`${ok ? "✓" : "✗"} ${c.label}`);
  if (!ok) failed += 1;
}
console.log("\nKnown hollow (documented, not yet real):");
for (const h of knownHollow) console.log(`  · ${h}`);
console.log("");
process.exit(failed > 0 ? 1 : 0);
