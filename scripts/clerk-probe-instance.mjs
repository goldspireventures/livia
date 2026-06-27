#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env");
if (!existsSync(envPath)) {
  console.error("missing .env");
  process.exit(1);
}
let sk = "";
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^CLERK_SECRET_KEY=(.+)$/);
  if (m) sk = m[1].trim().replace(/^["']|["']$/g, "");
}
if (!sk) {
  console.error("missing CLERK_SECRET_KEY");
  process.exit(1);
}
console.log("secret prefix", sk.slice(0, 12) + "...");

const paths = ["/v1/instance", "/v1/clients"];
for (const path of paths) {
  const r = await fetch(`https://api.clerk.com${path}`, {
    headers: { Authorization: `Bearer ${sk}` },
  });
  const text = await r.text();
  console.log(path, r.status, text.slice(0, 400));
}
