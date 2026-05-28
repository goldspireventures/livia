#!/usr/bin/env node
/**
 * Run Maestro flows for mobile visual captures.
 * Requires: maestro CLI, Expo app on simulator/device, API + demo provisioned.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "e2e", "visual-captures", "mobile");
const flowsDir = path.join(root, "maestro", "flows");

function resolveJavaHome() {
  if (process.env.JAVA_HOME && fs.existsSync(process.env.JAVA_HOME)) {
    return process.env.JAVA_HOME;
  }
  const pf = process.env["ProgramFiles"] ?? "C:\\Program Files";
  if (process.platform === "win32") {
    try {
      const dirs = fs.readdirSync(path.join(pf, "Microsoft"), { withFileTypes: true });
      const jdk = dirs.find((d) => d.isDirectory() && d.name.startsWith("jdk-"));
      if (jdk) return path.join(pf, "Microsoft", jdk.name);
    } catch {
      /* ignore */
    }
    const studioJbr = path.join(pf, "Android", "Android Studio", "jbr");
    if (fs.existsSync(studioJbr)) return studioJbr;
  }
  return null;
}

const javaHome = resolveJavaHome();
const env = {
  ...process.env,
  ...(javaHome ? { JAVA_HOME: javaHome } : {}),
  MAESTRO_APP_ID: process.env.MAESTRO_APP_ID ?? "io.livia.app",
  MAESTRO_DEMO_EMAIL: process.env.MAESTRO_DEMO_EMAIL ?? "demo-owner@livia.io",
  MAESTRO_DEMO_PASSWORD: process.env.MAESTRO_DEMO_PASSWORD ?? "LiviaDemo2026!",
};

/** Order: sign-in base → personas → vertical glance passes */
const flows = [
  "capture-owner-tabs.yaml",
  "capture-founder-more.yaml",
  "capture-founder-verticals.yaml",
  "capture-persona-manager.yaml",
  "capture-persona-staff.yaml",
  "capture-persona-receptionist.yaml",
];

function which(cmd) {
  const r = spawnSync(process.platform === "win32" ? "where" : "which", [cmd], {
    encoding: "utf8",
    shell: true,
  });
  if (r.status !== 0) return null;
  const line = (r.stdout ?? "").trim().split(/\r?\n/)[0];
  return line || null;
}

function resolveMaestroBin() {
  if (process.env.MAESTRO_BIN) return process.env.MAESTRO_BIN;
  const onPath = which("maestro");
  if (onPath) return onPath;
  const home = process.env.USERPROFILE ?? process.env.HOME ?? "";
  const candidates = [
    path.join(home, ".maestro", "maestro", "bin", process.platform === "win32" ? "maestro.bat" : "maestro"),
    path.join(home, ".maestro", "bin", process.platform === "win32" ? "maestro.bat" : "maestro"),
    path.join(process.env.LOCALAPPDATA ?? "", "Maestro", "bin", "maestro.bat"),
    path.join(process.env.ProgramFiles ?? "", "Maestro", "bin", "maestro.bat"),
    "/usr/local/bin/maestro",
    "/opt/homebrew/bin/maestro",
  ].filter(Boolean);
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

const maestroBin = resolveMaestroBin();
if (!maestroBin) {
  console.error(
    "Maestro CLI not found. Install: https://maestro.mobile.dev/getting-started/installing-maestro",
  );
  console.error("Or set MAESTRO_BIN to your maestro executable.");
  process.exit(1);
}
console.log(`Using Maestro: ${maestroBin}`);

fs.mkdirSync(outDir, { recursive: true });

for (const flow of flows) {
  const flowPath = path.join(flowsDir, flow);
  if (!fs.existsSync(flowPath)) {
    console.error(`Missing flow: ${flowPath}`);
    process.exit(1);
  }
  console.log(`\n▶ maestro test ${flow}`);
  const r = spawnSync(maestroBin, ["test", flowPath], {
    cwd: root,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    console.error(`Flow failed: ${flow}`);
    process.exit(r.status ?? 1);
  }
}

console.log(`\nDone. Screenshots under ${outDir}`);
