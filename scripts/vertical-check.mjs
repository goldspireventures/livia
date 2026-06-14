#!/usr/bin/env node
/**
 * R3 vertical registry gate — packs, presets, demo slugs aligned with E2E.
 *
 *   pnpm vertical:check
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiServerCwd = join(root, "artifacts", "api-server");

function run(label, args, { cwd = apiServerCwd } = {}) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync("node", args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    console.error(`✗ ${label} failed`);
    process.exit(r.status ?? 1);
  }
  console.log(`✓ ${label}`);
}

console.log("\n══ Vertical check (R3) ══\n");

run("Policy vertical registry", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/vertical-registry.test.ts",
]);

run("Presentation presets smoke", [
  "--import",
  "tsx/esm",
  "src/services/__tests__/presentation-presets.test.ts",
]);

run("Presentation surface handshake", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/presentation-surface.test.ts",
]);

run("Vertical doc propagation", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/vertical-doc-propagation.test.ts",
]);

run("Vertical announcement handshake", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/vertical-announcement.test.ts",
]);

run("Event catalog (blueprint H)", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/event-catalog.test.ts",
]);

run("Activation metrics (V1 sacred metric)", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/activation-metrics.test.ts",
]);

run("Capability registry (blueprint C phase 1)", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/capability-registry.test.ts",
]);

run("Capability resolution (blueprint C)", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/capability-resolution.test.ts",
]);

run("Capability instances (Era 2 v0)", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/capability-instances.test.ts",
]);

run("Commerce briefing (Era 2 owner signals)", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/commerce-briefing.test.ts",
]);

run("Commerce signals (Era 2 Liv loop)", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/commerce-signals.test.ts",
]);

run("Capability health score", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/capability-health-score.test.ts",
]);

run("Morning briefing intel", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/morning-briefing-intel.test.ts",
]);

run("Commerce act playbooks", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/commerce-act-playbooks.test.ts",
]);

run("Capability commerce bridge", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/capability-commerce-bridge.test.ts",
]);

run("Commerce add-on registry", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/commerce-addon-program.test.ts",
]);

run("Commerce entitlements unlock copy", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/commerce-entitlements.test.ts",
]);

run("Owner Liv inbox suggestions", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/owner-liv-inbox-suggestions.test.ts",
]);

run("Liv proposal navigation", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/liv-proposal-navigation.test.ts",
]);

run("Activity feed enrichment", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/activity-feed-enrichment.test.ts",
]);

run("Owner presence intel", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/owner-presence-intel.test.ts",
]);

run("Owner intelligence nav", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/owner-intelligence-nav.test.ts",
  "../../lib/policy/src/__tests__/owner-intelligence-home.test.ts",
  "../../lib/policy/src/__tests__/twin-observations.test.ts",
  "../../lib/policy/src/__tests__/twin-risks-opportunities.test.ts",
  "../../lib/policy/src/__tests__/twin-domain-trajectory.test.ts",
  "../../lib/policy/src/__tests__/notification-policy-twin.test.ts",
  "../../lib/policy/src/__tests__/guest-hub-policy.test.ts",
  "../../lib/policy/src/__tests__/operator-nav-policy.test.ts",
]);

run("Capability nav gates", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/capability-nav.test.ts",
]);

run("Operational policy (Liv setup I-B)", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/operational-policy.test.ts",
]);

run("Relationship layer (Era 1 Q2)", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/relationship.test.ts",
]);

run("Setup guided flow (copilot v2)", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/setup-guided-flow.test.ts",
]);

run("Vertical starter packs", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/vertical-starter-packs.test.ts",
]);

run("Tenant retail program", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/tenant-retail-program.test.ts",
]);

run("Demo showcase program", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/demo-showcase-program.test.ts",
]);

run("Analytics event bridge (blueprint H)", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/analytics-event-bridge.test.ts",
]);

console.log("\n✅ vertical:check passed\n");
