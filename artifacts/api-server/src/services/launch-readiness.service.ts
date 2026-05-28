import { db, businessesTable } from "@workspace/db";
import { inArray } from "drizzle-orm";
import { DEMO_WORLD_SLUGS } from "../lib/demo-portal-config";
import { getDemoPortalStatus } from "./demo-portal.service";

export type ReadinessItem = {
  id: string;
  track: "product" | "platform" | "comms" | "money" | "compliance" | "ops";
  label: string;
  status: "done" | "partial" | "blocked" | "ops";
  detail?: string;
};

function envSet(key: string): boolean {
  return !!process.env[key]?.trim();
}

export async function getLaunchReadiness(): Promise<{
  gate2Ready: boolean;
  gate3Ready: boolean;
  items: ReadinessItem[];
}> {
  const demo = await getDemoPortalStatus();
  const stripe =
    envSet("STRIPE_SECRET_KEY") &&
    (envSet("STRIPE_PRICE_SOLO") || envSet("STRIPE_PRICE_STUDIO"));
  const clerk = envSet("CLERK_SECRET_KEY") && envSet("CLERK_PUBLISHABLE_KEY");
  const dbOk = envSet("DATABASE_URL");
  const resend = envSet("RESEND_API_KEY");
  const twilio =
    envSet("TWILIO_ACCOUNT_SID") && envSet("TWILIO_AUTH_TOKEN");
  const internal = envSet("INTERNAL_OPS_SECRET");
  const inngest = envSet("INNGEST_EVENT_KEY") || envSet("INNGEST_SIGNING_KEY");

  const items: ReadinessItem[] = [
    {
      id: "demo-world",
      track: "product",
      label: "Demo world (Aurora + 6 users + inbox threads)",
      status: demo.provisioned ? "done" : "partial",
      detail: demo.provisioned
        ? `${demo.businesses.length} businesses`
        : "Run POST /api/demo/provision",
    },
    {
      id: "persona-rituals",
      track: "product",
      label: "Persona rituals (web nav + home + Liv briefing)",
      status: "done",
    },
    {
      id: "mobile-rituals",
      track: "product",
      label: "Mobile persona tabs + parity slice",
      status: "partial",
      detail: "Ritual labels; full native goodies deferred",
    },
    {
      id: "clerk",
      track: "platform",
      label: "Clerk auth configured",
      status: clerk ? "done" : "blocked",
    },
    {
      id: "database",
      track: "platform",
      label: "Postgres + migrations",
      status: dbOk ? "done" : "blocked",
    },
    {
      id: "stripe-billing",
      track: "money",
      label: "Stripe Billing (checkout + webhooks)",
      status: stripe ? "partial" : "blocked",
      detail: stripe ? "Needs first paid subscriber (ops)" : "Set STRIPE_* in .env",
    },
    {
      id: "stripe-connect",
      track: "money",
      label: "Stripe Connect (deposits)",
      status: "ops",
      detail: "Gate 3 — launch-plan L6 / #58",
    },
    {
      id: "resend",
      track: "comms",
      label: "Transactional email (Resend)",
      status: resend ? "partial" : "blocked",
      detail: resend ? "Verify domain + prod send" : "RESEND_API_KEY",
    },
    {
      id: "twilio",
      track: "comms",
      label: "SMS / voice (Twilio)",
      status: twilio ? "partial" : "blocked",
      detail: twilio ? "Provision per-shop numbers in prod" : "TWILIO_*",
    },
    {
      id: "reminders",
      track: "platform",
      label: "Booking reminders (Inngest/cron)",
      status: inngest ? "partial" : "blocked",
      detail: "Enable in production environment",
    },
    {
      id: "internal-ops",
      track: "ops",
      label: "Internal ops console",
      status: internal ? "partial" : "blocked",
      detail: internal ? ":5175 + INTERNAL_OPS_SECRET" : "Set secret in .env",
    },
    {
      id: "legal",
      track: "compliance",
      label: "Legal pages (ToS, Privacy, DPA)",
      status: "ops",
      detail: "Publish at livia.io/legal — counsel review",
    },
    {
      id: "eu-residency",
      track: "compliance",
      label: "EU production residency ADR",
      status: "ops",
      detail: "marketing-vs-reality row 6b / #57",
    },
    {
      id: "app-stores",
      track: "ops",
      label: "App Store + Play public",
      status: "ops",
    },
    {
      id: "design-partners",
      track: "ops",
      label: "10 design partners + real bookings",
      status: "ops",
      detail: "Gate 2 acceptance",
    },
  ];

  const blocked = items.filter((i) => i.status === "blocked");
  const gate2Ready =
    demo.provisioned &&
    clerk &&
    dbOk &&
    blocked.length === 0 &&
    items.find((i) => i.id === "resend")?.status !== "blocked";

  const gate3Ready =
    gate2Ready &&
    stripe &&
    items.every((i) => i.status !== "blocked") &&
    items.filter((i) => i.status === "ops").length <= 6;

  return { gate2Ready, gate3Ready, items };
}

/** Quick check: demo slugs exist */
export async function isDemoWorldProvisioned(): Promise<boolean> {
  const rows = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(inArray(businessesTable.slug, [...DEMO_WORLD_SLUGS]));
  return rows.length >= 4;
}
