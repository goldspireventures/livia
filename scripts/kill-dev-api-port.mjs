/**
 * Free port 3000 before `pnpm dev:api` when EADDRINUSE (Windows + Unix).
 *   node scripts/kill-dev-api-port.mjs
 */
import { execSync } from "node:child_process";
import { platform } from "node:os";

const port = process.argv[2] ?? "3000";

function killWindows() {
  let out = "";
  try {
    out = execSync(`netstat -ano | findstr ":${port}"`, { encoding: "utf8" });
  } catch {
    console.log(`No listener on port ${port}`);
    return;
  }
  const pids = new Set();
  for (const line of out.split("\n")) {
    if (!line.includes("LISTENING")) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && pid !== "0") pids.add(pid);
  }
  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "inherit" });
      console.log(`Stopped PID ${pid} on port ${port}`);
    } catch {
      console.warn(`Could not stop PID ${pid}`);
    }
  }
  if (pids.size === 0) console.log(`No listener on port ${port}`);
}

function killUnix() {
  try {
    const pid = execSync(`lsof -ti :${port}`, { encoding: "utf8" }).trim();
    if (!pid) {
      console.log(`No listener on port ${port}`);
      return;
    }
    for (const p of pid.split("\n")) {
      execSync(`kill -9 ${p}`, { stdio: "inherit" });
      console.log(`Stopped PID ${p} on port ${port}`);
    }
  } catch {
    console.log(`No listener on port ${port}`);
  }
}

if (platform() === "win32") killWindows();
else killUnix();
