#!/usr/bin/env node
/**
 * v1.5 Phase 0.5 — critical route checklist for axe/pa11y runs.
 * Run manually when dashboard is up:
 *   npx @axe-core/cli http://127.0.0.1:5173/dashboard --save results.json
 */
const BASE = process.argv[2] ?? "http://127.0.0.1:5173";

const ROUTES = [
  "/dashboard",
  "/bookings",
  "/customers",
  "/inbox",
  "/settings",
  "/onboarding",
  "/host",
  "/brands",
  "/chain",
  "/rota",
  "/portal",
];

console.log("# v1.5 WCAG critical routes\n");
for (const path of ROUTES) {
  console.log(`${BASE}${path}`);
}
console.log("\n# Marketing (livia.io) — when pnpm dev:marketing is up:");
const MKT = process.argv[3] ?? "http://127.0.0.1:5174";
for (const path of ["/", "/pricing", "/how-it-works", "/verticals/hair", "/for/chair-rental"]) {
  console.log(`${MKT}${path}`);
}
console.log("\n# Example: npx @axe-core/cli <url> --exit");
