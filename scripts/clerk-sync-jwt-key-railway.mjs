#!/usr/bin/env node
/**
 * Sync live Clerk JWKS public key to Railway as CLERK_JWT_KEY.
 * Fixes pk_live + sk_test mismatch until sk_live is set on Railway.
 *
 *   node scripts/clerk-sync-jwt-key-railway.mjs --dry-run
 *   node scripts/clerk-sync-jwt-key-railway.mjs
 */
import { createPublicKey } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const dryRun = process.argv.includes("--dry-run");
const root = resolve(import.meta.dirname, "..");

function readEnvKey(file, key) {
  if (!existsSync(file)) return undefined;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(new RegExp(`^\\s*${key}=(.*)$`));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return undefined;
}

function clerkHostFromPk(pk) {
  if (!pk?.startsWith("pk_")) throw new Error("invalid publishable key");
  return Buffer.from(pk.split("_").slice(2).join("_"), "base64").toString("utf8").replace(/\$$/, "");
}

function railway(args, input) {
  const r = spawnSync("railway", args, { encoding: "utf8", input, shell: process.platform === "win32" });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || "railway failed").trim());
  return (r.stdout || "").trim();
}

const pk =
  readEnvKey(resolve(root, "railway.production.env"), "CLERK_PUBLISHABLE_KEY") ??
  "pk_live_Y2xlcmsubGl2aWEtaHEuY29t";
const host = clerkHostFromPk(pk);
const jwksUrl = `https://${host}/.well-known/jwks.json`;
console.log("Clerk host", host);

const jwksRes = await fetch(jwksUrl);
if (!jwksRes.ok) throw new Error(`JWKS HTTP ${jwksRes.status}`);
const jwks = await jwksRes.json();
const jwk = jwks.keys?.[0];
if (!jwk) throw new Error("no JWKS keys");

const pem = createPublicKey({ key: jwk, format: "jwk" }).export({ type: "spki", format: "pem" });
console.log("PEM lines", pem.split("\n").length, "kid", jwk.kid);

if (dryRun) {
  console.log("[dry-run] would set CLERK_JWT_KEY on Railway");
  process.exit(0);
}

railway(["variable", "set", "CLERK_JWT_KEY", "--stdin"], pem);
console.log("Set CLERK_JWT_KEY on Railway. Redeploying service…");
railway(["redeploy", "--yes"]);
console.log("Done. Verify: node scripts/prod-smoke.mjs");
