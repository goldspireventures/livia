#!/usr/bin/env node
/**
 * Provision Livia Stripe catalogue + webhook (idempotent).
 *
 *   node --env-file=.env scripts/stripe-provision-livia.mjs
 *   node --env-file=.env scripts/stripe-provision-livia.mjs --live
 *   node --env-file=.env scripts/stripe-provision-livia.mjs --write-env
 *   node --env-file=.env scripts/stripe-provision-livia.mjs --railway-cmd
 *
 * Requires STRIPE_SECRET_KEY (sk_test_* or sk_live_*). Stripe CLI login alone
 * is not enough for live writes — use a secret key from Dashboard → API keys.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(resolve(import.meta.dirname, "../artifacts/api-server/package.json"));
const Stripe = require("stripe");

function parseEnvFile(path) {
  const map = new Map();
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    map.set(t.slice(0, eq).trim(), t.slice(eq + 1).trim());
  }
  return map;
}

function stripeSecretFromRepoEnv() {
  const envPath = resolve(import.meta.dirname, "..", ".env");
  if (!existsSync(envPath)) return null;
  return parseEnvFile(envPath).get("STRIPE_SECRET_KEY")?.trim() ?? null;
}

const live = process.argv.includes("--live");
const writeEnv = process.argv.includes("--write-env");
const railwayCmd = process.argv.includes("--railway-cmd");
const webhookUrl =
  process.env.STRIPE_WEBHOOK_URL?.trim() || "https://api.livia-hq.com/api/webhooks/stripe";

const secret =
  (live ? stripeSecretFromRepoEnv() : null) ??
  process.env.STRIPE_SECRET_KEY?.trim();
if (!secret?.startsWith("sk_")) {
  console.error(
    "STRIPE_SECRET_KEY must be set to sk_test_* or sk_live_* (not rk_live restricted CLI key).",
  );
  console.error("Dashboard: https://dashboard.stripe.com/apikeys");
  process.exit(1);
}

const keyIsLive = secret.startsWith("sk_live_");
if (live && !keyIsLive) {
  console.error("--live requires STRIPE_SECRET_KEY=sk_live_*");
  process.exit(1);
}
if (!live && keyIsLive) {
  console.error("Refusing to provision with sk_live_ without --live flag.");
  process.exit(1);
}

const stripe = new Stripe(secret);

const PLANS = [
  { id: "solo", name: "Livia Solo", cents: 7900, desc: "Solo plan for one shop." },
  { id: "studio", name: "Livia Studio", cents: 14900, desc: "Studio plan for growing teams." },
  { id: "chain", name: "Livia Chain", cents: 24900, desc: "Chain plan for multi-location businesses." },
  { id: "chair-host", name: "Livia Host", cents: 9900, desc: "Host plan for chair rental workflows." },
];

const ADDONS = [
  { id: "peer_set_insights", name: "Livia Peer Insights", cents: 4900, desc: "Peer benchmark add-on." },
  { id: "event_operator_pack", name: "Livia Event Operator", cents: 4900, desc: "Event operator add-on." },
  { id: "retail_pack", name: "Livia Take-Home Retail", cents: 2900, desc: "Retail pack add-on." },
];

const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
  "charge.refunded",
  "charge.dispute.created",
];

async function findProduct(metaKey, metaValue) {
  const res = await stripe.products.search({
    query: `metadata['app']:'livia' AND metadata['${metaKey}']:'${metaValue}'`,
    limit: 1,
  });
  return res.data[0] ?? null;
}

async function ensurePlanPrice(plan) {
  let product = await findProduct("plan_id", plan.id);
  if (!product) {
    product = await stripe.products.create({
      name: plan.name,
      description: plan.desc,
      metadata: { app: "livia", kind: "plan", plan_id: plan.id },
    });
    console.log(`created product ${plan.id} → ${product.id}`);
  } else {
    console.log(`found product ${plan.id} → ${product.id}`);
  }

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 20 });
  const match = prices.data.find(
    (p) =>
      p.currency === "eur" &&
      p.unit_amount === plan.cents &&
      p.recurring?.interval === "month",
  );
  if (match) {
    console.log(`found price ${plan.id} → ${match.id}`);
    return match.id;
  }

  const price = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: plan.cents,
    recurring: { interval: "month" },
    metadata: { app: "livia", plan_id: plan.id },
  });
  console.log(`created price ${plan.id} → ${price.id}`);
  return price.id;
}

async function ensureAddonPrice(addon) {
  let product = await findProduct("addon_id", addon.id);
  if (!product) {
    product = await stripe.products.create({
      name: addon.name,
      description: addon.desc,
      metadata: { app: "livia", kind: "addon", addon_id: addon.id },
    });
    console.log(`created addon product ${addon.id} → ${product.id}`);
  } else {
    console.log(`found addon product ${addon.id} → ${product.id}`);
  }

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 20 });
  const match = prices.data.find(
    (p) =>
      p.currency === "eur" &&
      p.unit_amount === addon.cents &&
      p.recurring?.interval === "month",
  );
  if (match) {
    console.log(`found addon price ${addon.id} → ${match.id}`);
    return match.id;
  }

  const price = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: addon.cents,
    recurring: { interval: "month" },
    metadata: { app: "livia", addon_id: addon.id },
  });
  console.log(`created addon price ${addon.id} → ${price.id}`);
  return price.id;
}

async function ensureWebhook() {
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  const hit = existing.data.find((w) => w.url === webhookUrl && w.status === "enabled");
  if (hit) {
    console.log(`found webhook → ${hit.id} (secret not re-printed; use Dashboard or create new)`);
    return null;
  }

  const wh = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: WEBHOOK_EVENTS,
    description: "Livia API billing webhooks",
    metadata: { app: "livia" },
  });
  console.log(`created webhook → ${wh.id}`);
  return wh.secret ?? null;
}

const envOut = {
  STRIPE_SECRET_KEY: secret,
  STRIPE_ALLOW_PROMOTION_CODES: "true",
};

for (const p of PLANS) {
  const priceId = await ensurePlanPrice(p);
  const envKey =
    p.id === "chair-host"
      ? "STRIPE_PRICE_CHAIR_HOST"
      : `STRIPE_PRICE_${p.id.toUpperCase().replace(/-/g, "_")}`;
  envOut[envKey] = priceId;
}

for (const a of ADDONS) {
  const priceId = await ensureAddonPrice(a);
  const envKey =
    a.id === "peer_set_insights"
      ? "STRIPE_PRICE_PEER_INSIGHTS"
      : a.id === "event_operator_pack"
        ? "STRIPE_PRICE_EVENT_OPERATOR"
        : "STRIPE_PRICE_RETAIL_PACK";
  envOut[envKey] = priceId;
}

const webhookSecret = await ensureWebhook();
if (webhookSecret) {
  envOut.STRIPE_WEBHOOK_SECRET = webhookSecret;
}

console.log("\n--- Stripe env (mode: " + (keyIsLive ? "live" : "test") + ") ---");
for (const [k, v] of Object.entries(envOut)) {
  console.log(`${k}=${v}`);
}

if (railwayCmd) {
  const pairs = Object.entries(envOut)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  console.log("\n--- Railway ---");
  console.log(`railway variable set ${pairs} --environment production`);
}

if (writeEnv) {
  const envPath = resolve(import.meta.dirname, "..", ".env");
  if (!existsSync(envPath)) {
    console.error("No .env to update");
    process.exit(1);
  }
  let text = readFileSync(envPath, "utf8");
  for (const [key, val] of Object.entries(envOut)) {
    const re = new RegExp(`^${key}=.*$`, "m");
    const line = `${key}=${val}`;
    text = re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`;
  }
  writeFileSync(envPath, text);
  console.log("\nUpdated .env");
}
