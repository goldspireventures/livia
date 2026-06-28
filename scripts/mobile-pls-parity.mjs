#!/usr/bin/env node
/**
 * Mobile PLS parity — code + API verification without emulator/screenshots.
 *
 * Same simulations as Maestro/PLS where possible; static analysis for the rest.
 *
 *   pnpm pls:mobile-parity
 *
 * Output: artifacts/pls/mobile-parity-report.json
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { scanText, FORBIDDEN_CUSTOMER_PATTERNS } from "./pls-forbidden-copy.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mobileRoot = join(root, "artifacts", "livia-mobile");
const maestroRoot = join(root, "maestro", "flows");
const runDate = process.env.PLS_RUN_DATE ?? new Date().toISOString().slice(0, 10);
const outDir = join(root, "artifacts", "pls");
const outJson = join(outDir, `mobile-parity-report-${runDate}.json`);

/** Web PLS / dashboard route → mobile implementation (file must exist). */
const SURFACE_MAP = [
  { id: "owner-today", web: "/dashboard", mobile: "app/(tabs)/index.tsx", pls: "W7" },
  { id: "bookings-list", web: "/bookings", mobile: "app/(tabs)/bookings.tsx", pls: "W7" },
  { id: "booking-new", web: "/bookings/new", mobile: "app/booking/new.tsx", pls: "W7" },
  { id: "booking-detail", web: "/bookings/:id", mobile: "app/booking/[id].tsx", pls: "W7" },
  { id: "customers", web: "/customers", mobile: "app/(tabs)/customers.tsx", pls: "W7" },
  { id: "customer-detail", web: "/customers/:id", mobile: "app/customer/[id].tsx", pls: "W7" },
  { id: "inbox", web: "/inbox", mobile: "app/(tabs)/inbox.tsx", pls: "W7" },
  { id: "my-day", web: "/my-day", mobile: "app/(tabs)/my-day.tsx", pls: "W2" },
  { id: "approvals", web: "/bookings", mobile: "app/(tabs)/approvals.tsx", pls: "W7", note: "manager queue" },
  { id: "chain-glance", web: "/chain", mobile: "app/(tabs)/shops.tsx", pls: "W7" },
  { id: "staff", web: "/staff", mobile: "app/staff/index.tsx", pls: "W7" },
  { id: "services", web: "/services", mobile: "app/services/index.tsx", pls: "W7" },
  { id: "settings", web: "/settings", mobile: "app/settings.tsx", pls: "W7" },
  { id: "audit", web: "/audit", mobile: "app/audit.tsx", pls: "W7" },
  { id: "lifecycle", web: "/lifecycle", mobile: "app/lifecycle.tsx", pls: "W7" },
  { id: "premises", web: "/premises", mobile: "app/premises.tsx", pls: "W8" },
  { id: "day-packages", web: "/day-packages", mobile: "app/day-packages.tsx", pls: "W8" },
  { id: "onboarding", web: "/onboarding", mobile: "app/onboarding.tsx", pls: "W10" },
  { id: "onboarding-setup", web: "/onboarding", mobile: "app/onboarding-setup.tsx", pls: "W10" },
  { id: "legal", web: "/legal-acceptance", mobile: "app/legal-acceptance.tsx", pls: "W10" },
  { id: "sign-in", web: "/sign-in", mobile: "app/sign-in.tsx", pls: "W3" },
  { id: "demo-g1", web: "/demo", mobile: "app/demo/index.tsx", pls: "W9" },
  { id: "demo-wedge", web: "/demo/wedge/:v", mobile: "app/demo/wedge/[vertical].tsx", pls: "W9" },
  { id: "guest-hub", web: "/my", mobile: "app/my-livia/index.tsx", pls: "W6" },
  { id: "guest-account", web: "/my/account", mobile: "app/my-livia/account.tsx", pls: "W6" },
  { id: "guest-visit", web: "/my/:slug/visit/:id", mobile: "app/my-livia/[slug]/visit/[bookingId].tsx", pls: "W6" },
  { id: "public-book", web: "/b/:slug", mobile: "app/public-book/[slug].tsx", pls: "W6", note: "WebView / browser handoff" },
  { id: "guest-surface", web: "/b/:slug/visit/:token", mobile: "app/guest-surface.tsx", pls: "W6" },
  { id: "medspa-hub", web: "/medspa", mobile: "app/clinical-hub.tsx", pls: "W8", vertical: "medspa" },
  { id: "design-proofs", web: "/design-proofs", mobile: "app/design-proofs.tsx", pls: "W8", vertical: "body-art" },
  { id: "event-enquiries", web: "/enquiries", mobile: "app/enquiries.tsx", pls: "W8", vertical: "event-vendors" },
  { id: "event-quotes", web: "/quotes", mobile: "app/quotes.tsx", pls: "W8", vertical: "event-vendors" },
  { id: "event-site", web: "/event-site", mobile: "app/event-site.tsx", pls: "W8", vertical: "event-vendors" },
  { id: "classes", web: "/classes", mobile: "components/public/PublicFitnessClassList.tsx", pls: "W8", vertical: "fitness" },
  { id: "beauty-store", web: "/beauty-store", mobile: "app/store.tsx", pls: "W8", vertical: "beauty" },
  { id: "host", web: "/host", mobile: "app/host.tsx", pls: "W8", vertical: "hair" },
  { id: "brands", web: "/brands", mobile: "app/brands.tsx", pls: "W8" },
  { id: "rota", web: "/rota", mobile: "app/rota.tsx", pls: "W8" },
  { id: "franchise", web: "/franchise", mobile: "app/franchise.tsx", pls: "W8" },
  { id: "migration", web: "/settings?tab=integrations", mobile: "components/MigrationSwitchPanel.tsx", pls: "W4" },
  { id: "liv-mandate", web: "/settings?tab=liv", mobile: "app/liv-mandate.tsx", pls: "W7" },
  { id: "time-off", web: "/staff", mobile: "app/time-off.tsx", pls: "W7", note: "staff leave" },
  { id: "notifications", web: "/inbox", mobile: "app/notifications.tsx", pls: "W7" },
];

function readMobileDemoFlag() {
  const envPath = join(mobileRoot, ".env");
  if (!existsSync(envPath)) return false;
  const text = readFileSync(envPath, "utf8");
  return /EXPO_PUBLIC_DEMO_LOGIN\s*=\s*true/.test(text);
}

/** Maestro-critical testIDs — production cold open (always required). */
const MAESTRO_PROD_IDS = [
  "app-entry-gateway",
  "entry-gateway-guest",
  "entry-gateway-operator-register",
  "staff-invite-screen",
  "guest-hub-send-code",
  "email-input",
  "sign-in-back-to-gateway",
  "menu-settings",
  "menu-staff",
  "menu-services",
  "new-booking-button",
  "owner-liv-assist-fab",
  "guest-hub-home",
  "guest-hub-account-link",
  "migration-switch-panel",
];

/** Demo-only Maestro IDs — required only when EXPO_PUBLIC_DEMO_LOGIN=true. */
const MAESTRO_DEMO_IDS = [
  "entry-gateway-demo",
  "mobile-demo-launcher",
  "mobile-demo-back-entry",
];

/** Maestro IDs that are web-only or legacy — warn only. */
const MAESTRO_LEGACY_IDS = [
  "switch-persona-button",
  "persona-row-owner",
  "persona-row-auto",
];

/** Screens that must pull copy from policy / tenant-experience (no salon-default). */
const POLICY_AWARE_FILES = [
  "app/(tabs)/index.tsx",
  "app/(tabs)/bookings.tsx",
  "app/settings.tsx",
  "app/sign-in.tsx",
  "components/MigrationSwitchPanel.tsx",
  "app/my-livia/index.tsx",
];

function walkTsx(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".expo") continue;
      walkTsx(p, acc);
    } else if (/\.(tsx|ts)$/.test(name)) {
      acc.push(p);
    }
  }
  return acc;
}

function mobileFile(relPath) {
  return join(mobileRoot, relPath.replace(/\//g, "\\").replace(/\\/g, "/"));
}

function extractMaestroIds() {
  const ids = new Set();
  if (!existsSync(maestroRoot)) return ids;
  const re = /id:\s*["']([^"']+)["']/g;
  for (const file of readdirSync(maestroRoot)) {
    if (!file.endsWith(".yaml")) continue;
    const text = readFileSync(join(maestroRoot, file), "utf8");
    let m;
    while ((m = re.exec(text))) ids.add(m[1]);
  }
  return ids;
}

function testIdExists(id, blob) {
  if (blob.includes(`testID="${id}"`)) return true;
  if (blob.includes(`testID={\`${id}\`}`)) return true;
  if (id === "mobile-demo-wedge-beauty" && blob.includes("mobile-demo-wedge-${")) return true;
  if (id.startsWith("menu-") && blob.includes('testID={`menu-${item.label.toLowerCase()}`}')) return true;
  return false;
}

function scanMobileCopy(files) {
  const hits = [];
  for (const file of files) {
    const rel = relative(mobileRoot, file).replace(/\\/g, "/");
    if (rel.includes("_internal")) continue;
    if (!rel.startsWith("app/") && !rel.startsWith("components/")) continue;
    const text = readFileSync(file, "utf8");
    for (const h of scanText(text)) {
      hits.push({ file: rel, ...h });
    }
    if (/\bsalon\b/i.test(text) && !text.includes("@workspace/policy") && !text.includes("tenant-experience")) {
      if (/Text|title|label|placeholder|subtitle/i.test(text) && !file.includes("test")) {
        hits.push({
          file: rel,
          id: "salon-hardcode-suspect",
          hint: "Possible salon-default copy — prefer tenant-experience vocabulary",
          match: "salon",
        });
      }
    }
  }
  return hits;
}

function checkPolicyImports(files) {
  const missing = [];
  for (const rel of POLICY_AWARE_FILES) {
    const p = mobileFile(rel);
    if (!existsSync(p)) {
      missing.push({ file: rel, reason: "file missing" });
      continue;
    }
    const text = readFileSync(p, "utf8");
    const ok =
      text.includes("@workspace/policy") ||
      text.includes("tenant-experience") ||
      text.includes("useTenantExperience") ||
      text.includes("fetchTenantExperience");
    if (!ok) missing.push({ file: rel, reason: "no @workspace/policy or tenant-experience hook" });
  }
  return missing;
}

function runMobileEntrySmoke() {
  const mobileEnvPath = join(mobileRoot, ".env");
  let apiFromMobile = "";
  if (existsSync(mobileEnvPath)) {
    const m = readFileSync(mobileEnvPath, "utf8").match(/EXPO_PUBLIC_API_BASE_URL=(.+)/);
    if (m) apiFromMobile = m[1].trim();
  }
  const api = process.env.E2E_API_BASE ?? apiFromMobile ?? "";
  const guestOnly = api.includes("livia-hq.com") || process.argv.includes("--guest-only");
  const args = [join(root, "scripts", "mobile-entry-smoke.mjs")];
  if (guestOnly) args.push("--guest-only");
  const r = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, E2E_API_BASE: api || "http://127.0.0.1:3000" },
  });
  return { ok: r.status === 0, output: (r.stdout ?? "") + (r.stderr ?? ""), guestOnly };
}

function main() {
  console.log("\n══ Mobile PLS parity (no emulator) ══\n");

  const surfaceResults = SURFACE_MAP.map((s) => {
    const p = mobileFile(s.mobile);
    const pass = existsSync(p);
    console.log(`${pass ? "✓" : "✗"} ${s.id} — ${s.mobile}${s.note ? ` (${s.note})` : ""}`);
    return { ...s, pass, mobilePath: s.mobile };
  });

  const demoEnabled = readMobileDemoFlag();
  const MAESTRO_CRITICAL_IDS = [...MAESTRO_PROD_IDS, ...(demoEnabled ? MAESTRO_DEMO_IDS : [])];
  if (!demoEnabled) {
    console.log("ℹ Demo off — skipping entry-gateway-demo Maestro ID requirement");
  }

  const maestroIds = extractMaestroIds();
  const mobileFiles = walkTsx(mobileRoot);
  const mobileBlob = mobileFiles.map((f) => readFileSync(f, "utf8")).join("\n");

  const maestroResults = [...maestroIds].map((id) => {
    const inCritical = MAESTRO_CRITICAL_IDS.includes(id);
    const legacy = MAESTRO_LEGACY_IDS.includes(id);
    const found = testIdExists(id, mobileBlob);
    if (inCritical || legacy || id.startsWith("entry-") || id.startsWith("guest-") || id.startsWith("mobile-demo")) {
      const tag = legacy ? " (legacy maestro — warn)" : "";
      console.log(`${found ? "✓" : legacy ? "⚠" : "✗"} maestro id: ${id}${tag}`);
    }
    return { id, found, critical: inCritical, legacy };
  });

  const criticalMissing = maestroResults.filter((m) => m.critical && !m.found);
  for (const id of MAESTRO_CRITICAL_IDS) {
    if (maestroResults.some((m) => m.id === id)) continue;
    const found = testIdExists(id, mobileBlob);
    console.log(`${found ? "✓" : "✗"} maestro id (listed): ${id}`);
    maestroResults.push({ id, found, critical: true, legacy: false });
    if (!found) criticalMissing.push({ id, found: false, critical: true });
  }

  const legacyMissing = maestroResults.filter((m) => m.legacy && !m.found);

  const copyHits = scanMobileCopy(mobileFiles);
  for (const h of copyHits.slice(0, 8)) {
    console.log(`✗ copy ${h.id} in ${h.file}`);
  }
  if (copyHits.length > 8) console.log(`  … +${copyHits.length - 8} more copy hits`);

  const policyGaps = checkPolicyImports(mobileFiles);
  for (const g of policyGaps) {
    console.log(`✗ policy hook: ${g.file} — ${g.reason}`);
  }

  console.log("\n▶ API spine (guest + operator entry)…");
  const apiSpine = runMobileEntrySmoke();
  console.log(apiSpine.ok ? "✓ mobile-entry-smoke" : "✗ mobile-entry-smoke failed");

  const surfaceFail = surfaceResults.filter((s) => !s.pass).length;
  const ok =
    surfaceFail === 0 &&
    criticalMissing.length === 0 &&
    copyHits.length === 0 &&
    policyGaps.length === 0 &&
    apiSpine.ok;

  const report = {
    runDate,
    generatedAt: new Date().toISOString(),
    mode: "code-and-api-no-emulator",
    status: ok ? "pass" : "fail",
    surfaces: { total: surfaceResults.length, pass: surfaceResults.length - surfaceFail, fail: surfaceFail },
    maestroIds: { criticalMissing: criticalMissing.map((m) => m.id), legacyMissing: legacyMissing.map((m) => m.id) },
    copyHits,
    policyGaps,
    apiSpine: apiSpine.ok,
    manualVisualChecklist: "docs/testing/MOBILE-MANUAL-VISUAL-CHECKLIST.md",
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outJson, JSON.stringify(report, null, 2));

  console.log(`\n→ ${outJson}`);
  console.log(ok ? "\n✅ Mobile PLS parity passed (code + API)\n" : "\n❌ Mobile PLS parity failed\n");
  console.log("Manual visual pass: docs/testing/MOBILE-MANUAL-VISUAL-CHECKLIST.md\n");
  process.exit(ok ? 0 : 1);
}

main();
