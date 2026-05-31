#!/usr/bin/env node
/**
 * Log exec hat work to the cockpit ledger (Track H).
 *
 *   pnpm exec:hat-work --hat cto --summary "Shipped demo depth E2E"
 *   pnpm exec:hat-work --hat cpo --summary "…" --link "Spec|docs/product/foo.md"
 *
 * Env: API_URL (default http://127.0.0.1:3000), INTERNAL_OPS_SECRET, optional
 *      INTERNAL_OPS_OPERATOR, INTERNAL_OPS_ROLE (default exec).
 */

function parseArgs(argv) {
  const out = { hat: "", summary: "", links: [], actor: "agent", actorLabel: "cursor-agent", source: "cli" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--hat" && argv[i + 1]) out.hat = argv[++i];
    else if (a === "--summary" && argv[i + 1]) out.summary = argv[++i];
    else if (a === "--actor" && argv[i + 1]) out.actor = argv[++i];
    else if (a === "--actor-label" && argv[i + 1]) out.actorLabel = argv[++i];
    else if (a === "--source" && argv[i + 1]) out.source = argv[++i];
    else if (a === "--session-id" && argv[i + 1]) out.sessionId = argv[++i];
    else if (a === "--link" && argv[i + 1]) {
      const raw = argv[++i];
      const pipe = raw.indexOf("|");
      if (pipe >= 0) {
        out.links.push({ label: raw.slice(0, pipe).trim(), href: raw.slice(pipe + 1).trim() });
      } else {
        out.links.push({ label: raw, href: raw });
      }
    }
  }
  return out;
}

const args = parseArgs(process.argv);
if (!args.hat || !args.summary) {
  console.error(
    "Usage: pnpm exec:hat-work --hat <ceo|coo|cpo|cto|cs|cro> --summary \"…\" [--link \"label|url\"] [--actor human|agent]",
  );
  process.exit(1);
}

const base = (process.env.API_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const secret = process.env.INTERNAL_OPS_SECRET ?? "";
if (!secret) {
  console.error("INTERNAL_OPS_SECRET is required (from .env)");
  process.exit(1);
}

const body = {
  hatId: args.hat,
  summary: args.summary,
  actor: args.actor === "human" ? "human" : "agent",
  actorLabel: args.actorLabel,
  source: args.source,
  links: args.links.length ? args.links : undefined,
  sessionId: args.sessionId,
};

const res = await fetch(`${base}/api/internal/ops/exec/work-events`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Internal-Ops-Secret": secret,
    "X-Internal-Ops-Operator": process.env.INTERNAL_OPS_OPERATOR ?? "founder@livia-hq.com",
    "X-Internal-Ops-Role": process.env.INTERNAL_OPS_ROLE ?? "exec",
  },
  body: JSON.stringify(body),
});

const text = await res.text();
let json;
try {
  json = text ? JSON.parse(text) : null;
} catch {
  json = { raw: text };
}

if (!res.ok) {
  console.error(`exec:hat-work failed (${res.status})`, json);
  process.exit(1);
}

console.log("Logged exec work:", json?.event?.id ?? json);
process.exit(0);
