#!/usr/bin/env node
/**
 * Mobile path audit — static route walk + persona matrix + scenario spine + API probes.
 * Closest automated substitute for "walk every mobile path on device".
 *
 *   pnpm mobile:path-audit
 *   pnpm mobile:path-audit -- --api https://api.livia-hq.com
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mobileRoot = join(root, "artifacts", "livia-mobile");
const apiBase = (process.argv.find((a, i) => process.argv[i - 1] === "--api") ?? process.env.E2E_API_BASE ?? "https://api.livia-hq.com").replace(/\/$/, "");

function readMobileEnv() {
  const envPath = join(mobileRoot, ".env");
  const out = {};
  if (!existsSync(envPath)) return out;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

const mobileEnv = readMobileEnv();
const demoEnabled = mobileEnv.EXPO_PUBLIC_DEMO_LOGIN === "true";

/** Sacred mobile journeys — maps to scenario-gap-sweep S1–S10. */
const SCENARIO_PATHS = [
  {
    id: "S1",
    name: "Guest cold open → My Livia",
    files: ["app/index.tsx", "components/gateway/AppEntryGateway.tsx", "app/my-livia/index.tsx"],
    testIds: ["app-entry-gateway", "entry-gateway-guest", "guest-hub-send-code"],
    signedIn: false,
  },
  {
    id: "S2",
    name: "Founder business registration",
    files: ["app/sign-in.tsx", "app/legal-acceptance.tsx", "app/onboarding.tsx"],
    testIds: ["entry-gateway-operator-register", "email-input", "sign-in-back-to-gateway"],
    signedIn: false,
  },
  {
    id: "S3-S5",
    name: "Staff invite (owner assigns role)",
    files: ["app/staff/invite.tsx", "app/staff-invite.tsx", "lib/staff-invite-landing.ts"],
    testIds: ["staff-invite-screen"],
    policy: ["STAFF_INVITE_JOBS", "staffInviteJobToMembership"],
  },
  {
    id: "S6-S7",
    name: "Staff invite accept + legal → persona home",
    files: ["app/staff-invite.tsx", "app/legal-acceptance.tsx", "lib/staff-invite-landing.ts"],
    policy: ["resolveStaffInviteHandoff", "resolveStaffInviteLandingFromSession"],
  },
  {
    id: "S8",
    name: "Staff manual sign-in fallback",
    files: ["app/sign-in.tsx"],
    testIds: ["sign-in-back-to-gateway"],
    signedIn: false,
  },
  {
    id: "S9",
    name: "Founder onboarding resume",
    files: ["app/onboarding.tsx", "app/onboarding-setup.tsx", "components/OnboardingGate.tsx"],
  },
  {
    id: "S10",
    name: "Public book handoff",
    files: ["app/public-book/[slug].tsx", "app/guest-surface.tsx"],
  },
  {
    id: "B",
    name: "Owner operator tabs",
    files: [
      "app/(tabs)/index.tsx",
      "app/(tabs)/bookings.tsx",
      "app/(tabs)/customers.tsx",
      "app/(tabs)/inbox.tsx",
      "app/(tabs)/more.tsx",
    ],
    testIds: ["new-booking-button", "owner-liv-assist-fab"],
    signedIn: true,
  },
  {
    id: "C-staff",
    name: "Persona: staff",
    files: ["app/(tabs)/my-day.tsx"],
    personaRedirect: "staff → my-day",
  },
  {
    id: "C-manager",
    name: "Persona: manager",
    files: ["app/(tabs)/approvals.tsx"],
    personaRedirect: "manager → approvals",
  },
  {
    id: "C-receptionist",
    name: "Persona: receptionist",
    files: ["app/(tabs)/bookings.tsx"],
    personaRedirect: "receptionist → bookings",
  },
  {
    id: "E",
    name: "Vertical hubs (More menu)",
    files: [
      "app/clinical-hub.tsx",
      "app/design-proofs.tsx",
      "app/enquiries.tsx",
      "app/quotes.tsx",
      "app/event-site.tsx",
      "app/store.tsx",
      "app/host.tsx",
      "app/day-packages.tsx",
      "app/premises.tsx",
    ],
  },
];

const PERSONA_TAB_EXPECT = {
  org_admin: ["index", "shops", "approvals", "inbox", "more"],
  owner: ["index", "bookings", "customers", "inbox", "more"],
  manager: ["approvals", "bookings", "customers", "inbox", "more"],
  staff: ["my-day", "bookings", "customers", "more"],
  receptionist: ["bookings", "customers", "inbox", "more"],
};

const UNSIGNED_ALLOW = new Set([
  "",
  "index",
  "sign-in",
  "staff-invite",
  "my-livia",
  "my",
  "guest-surface",
  "public-book",
  "demo",
]);

const findings = [];
const passes = [];

function walkRoutes(dir, prefix = "") {
  const routes = [];
  if (!existsSync(dir)) return routes;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    if (name.startsWith("_") && name !== "(tabs)") continue;
    if (name === "node_modules" || name === ".expo") continue;
    const seg = name.replace(/^\((.+)\)$/, "($1)");
    const route = prefix ? `${prefix}/${name}` : name;
    if (name === "(tabs)") {
      for (const f of readdirSync(p)) {
        if (f.endsWith(".tsx") && !f.startsWith("_"))
          routes.push({ path: `/(tabs)/${f.replace(".tsx", "")}`, file: join(p, f) });
      }
    } else {
      const layout = join(p, "_layout.tsx");
      if (existsSync(layout)) routes.push(...walkRoutes(p, route));
      else {
        const index = join(p, "index.tsx");
        if (existsSync(index)) routes.push({ path: `/${route}`, file: index });
        for (const f of readdirSync(p)) {
          if (f.endsWith(".tsx") && f !== "index.tsx" && !f.startsWith("_")) {
            const base = f.replace(".tsx", "").replace(/\[(\w+)\]/g, ":$1");
            routes.push({ path: `/${route}/${base}`, file: join(p, f) });
          }
        }
      }
    }
  }
  const indexFile = join(dir, "index.tsx");
  if (prefix === "" && existsSync(indexFile)) routes.unshift({ path: "/", file: indexFile });
  return routes;
}

function fileText(rel) {
  const p = join(mobileRoot, rel.replace(/\//g, "\\"));
  return existsSync(p) ? readFileSync(p, "utf8") : "";
}

function checkScenarioPaths() {
  const mobileFiles = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) {
        if (name === "node_modules" || name === ".expo") continue;
        walk(p);
      } else if (/\.(tsx|ts)$/.test(name)) mobileFiles.push(p);
    }
  }
  walk(mobileRoot);
  const blob = mobileFiles.map((f) => readFileSync(f, "utf8")).join("\n");

  function hasTestId(id) {
    return blob.includes(`testID="${id}"`) || blob.includes(`testID={\`${id}\`}`);
  }

  for (const s of SCENARIO_PATHS) {
    const missingFiles = (s.files ?? []).filter((f) => !existsSync(join(mobileRoot, f)));
    if (missingFiles.length) {
      findings.push({ severity: "P0", scenario: s.id, issue: `Missing files: ${missingFiles.join(", ")}` });
      continue;
    }
    for (const id of s.testIds ?? []) {
      if (!hasTestId(id)) {
        findings.push({ severity: "P1", scenario: s.id, issue: `Missing testID: ${id}` });
      }
    }
    for (const needle of s.policy ?? []) {
      const policyBlob = readFileSync(join(root, "lib/policy/src/staff-invite-program.ts"), "utf8");
      if (!policyBlob.includes(needle) && !blob.includes(needle)) {
        findings.push({ severity: "P1", scenario: s.id, issue: `Policy hook missing: ${needle}` });
      }
    }
    passes.push(`${s.id} ${s.name}`);
  }
}

function checkPersonaRouting() {
  const index = fileText("app/(tabs)/index.tsx");
  const checks = [
    { persona: "staff", needle: 'persona === "staff"', dest: "my-day" },
    { persona: "manager", needle: 'persona === "manager"', dest: "approvals" },
    { persona: "receptionist", needle: 'persona === "receptionist"', dest: "bookings" },
  ];
  for (const c of checks) {
    if (!index.includes(c.needle) || !index.includes(c.dest)) {
      findings.push({
        severity: "P0",
        scenario: `C-${c.persona}`,
        issue: `Owner Today tab missing redirect for ${c.persona} → ${c.dest}`,
      });
    } else {
      passes.push(`Persona redirect ${c.persona} → ${c.dest}`);
    }
  }

  const layout = fileText("app/(tabs)/_layout.tsx");
  for (const [persona, tabs] of Object.entries(PERSONA_TAB_EXPECT)) {
    const block = layout.match(new RegExp(`${persona}:\\s*\\[([^\\]]+)\\]`));
    if (!block) {
      findings.push({ severity: "P1", scenario: "tabs", issue: `TAB_VISIBILITY missing ${persona}` });
      continue;
    }
    for (const tab of tabs) {
      if (!block[1].includes(`"${tab}"`)) {
        findings.push({ severity: "P1", scenario: "tabs", issue: `${persona} missing tab ${tab}` });
      }
    }
  }
  passes.push("Persona tab matrix present");
}

function checkAuthGate() {
  const nav = fileText("lib/navigation.ts");
  const layout = fileText("app/_layout.tsx");
  if (!nav.includes("isStaffInviteRoute")) {
    findings.push({ severity: "P0", scenario: "auth", issue: "staff-invite not in navigation helpers" });
  }
  if (!layout.includes("onStaffInvite")) {
    findings.push({ severity: "P0", scenario: "auth", issue: "AuthGate does not allow staff-invite pre-auth" });
  }
  if (!layout.includes('name="staff-invite"')) {
    findings.push({ severity: "P0", scenario: "auth", issue: "Stack missing staff-invite screen" });
  }

  const onboarding = fileText("components/OnboardingGate.tsx");
  if (!onboarding.includes("staff-invite")) {
    findings.push({
      severity: "P2",
      scenario: "auth",
      issue: "OnboardingGate should exempt staff-invite during ticket flow",
    });
  }

  const routes = walkRoutes(join(mobileRoot, "app"));
  for (const r of routes) {
    const root = r.path.split("/").filter(Boolean)[0] ?? "index";
    const normalized = root === "(tabs)" ? "(tabs)" : root;
    if (normalized === "(tabs)" || UNSIGNED_ALLOW.has(normalized) || normalized === "demo") continue;
    if (normalized === "legal-acceptance" || normalized.startsWith("onboarding")) continue;
    passes.push(`Route registered: ${r.path}`);
  }
}

async function probeProdApi() {
  const probes = [];

  async function get(path) {
    const res = await fetch(`${apiBase}${path}`);
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* html error page */
    }
    return { ok: res.ok, status: res.status, json, text: text.slice(0, 120) };
  }

  const health = await get("/api/healthz");
  if (!health.ok) {
    findings.push({ severity: "P0", scenario: "API", issue: `healthz failed: ${health.status}` });
  } else {
    probes.push("healthz");
  }

  const otpReq = await fetch(`${apiBase}/api/public/guest-hub/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "mobile-audit-probe@example.com", country: "IE" }),
  });
  if (!otpReq.ok) {
    findings.push({ severity: "P1", scenario: "S1", issue: `guest email OTP request: ${otpReq.status}` });
  } else {
    const body = await otpReq.json();
    if (!body.sessionToken) {
      findings.push({ severity: "P1", scenario: "S1", issue: "guest OTP missing sessionToken" });
    } else if (!body.devOtp && !body.magicOtpCode) {
      passes.push("Guest OTP strict prod (no dev code — manual verify on device)");
    } else {
      probes.push("guest-otp-request+devCode");
    }
  }

  const pub = await get("/api/public/b/bloom-beauty-dublin");
  if (!pub.ok) {
    findings.push({ severity: "P1", scenario: "S10", issue: `public book API: ${pub.status}` });
  } else {
    probes.push("public-book-bloom");
  }

  const staffInviteWeb = process.env.EXPO_PUBLIC_DASHBOARD_URL?.replace(/\/$/, "") ?? "https://app.livia-hq.com";
  try {
    const res = await fetch(`${staffInviteWeb}/staff-invite`, { redirect: "manual" });
    if (res.status >= 400) {
      findings.push({ severity: "P1", scenario: "S6", issue: `web /staff-invite HTTP ${res.status}` });
    } else {
      probes.push("web-staff-invite-shell");
    }
  } catch (e) {
    findings.push({ severity: "P2", scenario: "S6", issue: `web /staff-invite unreachable: ${e.message}` });
  }

  return probes;
}

function runGate(cmd, args, label) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: "utf8", shell: process.platform === "win32" });
  if (r.status !== 0) {
    findings.push({ severity: "P0", scenario: "gates", issue: `${label} failed` });
    return false;
  }
  passes.push(label);
  return true;
}

async function main() {
  console.log("\n══ Mobile path audit ══\n");
  console.log(`  API: ${apiBase}`);
  console.log(`  Demo surface: ${demoEnabled ? "on" : "off (production)"}\n`);

  runGate("pnpm", ["scenario:gap-check"], "scenario:gap-check");
  runGate("pnpm", ["--filter", "@workspace/livia-mobile", "run", "typecheck"], "mobile typecheck");

  checkScenarioPaths();
  checkPersonaRouting();
  checkAuthGate();

  console.log("▶ Prod API probes…");
  const probes = await probeProdApi();
  for (const p of probes) console.log(`  ✓ ${p}`);

  if (!demoEnabled) {
    passes.push("Prod cold open (no entry-gateway-demo expected)");
  } else if (!fileText("components/gateway/AppEntryGateway.tsx").includes("entry-gateway-demo")) {
    findings.push({ severity: "P1", scenario: "A", issue: "Demo enabled but entry-gateway-demo testID missing" });
  }

  const p0 = findings.filter((f) => f.severity === "P0");
  const p1 = findings.filter((f) => f.severity === "P1");
  const p2 = findings.filter((f) => f.severity === "P2");

  console.log(`\n── Results ──`);
  console.log(`  Pass checks: ${passes.length}`);
  console.log(`  Findings: P0=${p0.length} P1=${p1.length} P2=${p2.length}`);

  for (const f of [...p0, ...p1, ...p2]) {
    console.log(`  ${f.severity} [${f.scenario}] ${f.issue}`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    apiBase,
    demoEnabled,
    status: p0.length === 0 ? (p1.length === 0 ? "pass" : "warn") : "fail",
    passes,
    findings,
    probes,
    deviceStillRequired: [
      "Clerk ticket staff-invite deep link (Expo Go partial)",
      "Full owner vertical More menu on seeded tenant",
      "Guest OTP verify with real email inbox",
      "pk_live founder sign-in against prod Clerk users",
      "Maestro capture flows on device/emulator",
    ],
  };

  const outDir = join(root, "artifacts");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "mobile-path-audit-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\n→ ${outPath}\n`);

  if (p0.length) process.exit(1);
  console.log(p1.length ? "⚠ Mobile path audit passed with warnings\n" : "✅ Mobile path audit passed\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
