#!/usr/bin/env node
/**
 * Optional Maestro mobile captures for PLS — skips gracefully when no device/CLI.
 *
 *   node scripts/pls-mobile-try.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const runDate = process.env.PLS_RUN_DATE ?? new Date().toISOString().slice(0, 10);

function which(cmd) {
  const r = spawnSync(process.platform === "win32" ? "where" : "which", [cmd], {
    encoding: "utf8",
    shell: true,
  });
  if (r.status !== 0) return null;
  return (r.stdout ?? "").trim().split(/\r?\n/)[0] || null;
}

const adb =
  process.env.ADB_PATH ??
  (existsSync(join(process.env.LOCALAPPDATA ?? "", "Android", "Sdk", "platform-tools", "adb.exe"))
    ? join(process.env.LOCALAPPDATA ?? "", "Android", "Sdk", "platform-tools", "adb.exe")
    : which("adb"));

let deviceCount = 0;
if (adb && existsSync(adb)) {
  const r = spawnSync(adb, ["devices"], { encoding: "utf8", shell: false });
  deviceCount = (r.stdout ?? "")
    .split(/\r?\n/)
    .filter((line) => /\tdevice\s*$/.test(line)).length;
}

const maestro = process.env.MAESTRO_BIN ?? which("maestro");

if (!maestro || deviceCount === 0) {
  console.log(
    `⊘ PLS mobile skip — maestro=${maestro ? "yes" : "no"} devices=${deviceCount}`,
  );
  process.exit(0);
}

console.log("▶ PLS mobile Maestro (cold-open gateway flow only)…");
const r = spawnSync(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["maestro:visual-capture"],
  {
    cwd: root,
    env: {
      ...process.env,
      MAESTRO_FLOWS: "capture-cold-open-gateway.yaml",
      PLS_RUN_DATE: runDate,
    },
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

if (r.status !== 0) {
  console.warn("⚠ Maestro capture failed — PLS Wave 5 continues (mobile optional)");
}
process.exit(0);
