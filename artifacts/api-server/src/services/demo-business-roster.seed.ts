import { createClerkClient } from "@clerk/express";
import { and, eq, inArray } from "drizzle-orm";
import { db, businessesTable, businessMembershipsTable } from "@workspace/db";
import { DEMO_ROLE_EMAILS, demoRoleEmailForSlug, type DemoTenantRole } from "@workspace/demo-logins";
import { mapWithConcurrency, withClerkRetry } from "../lib/async-pool";
import { generateId } from "../lib/id";
import {
  buildDemoRoleDef,
  DEMO_WORLD_SLUGS,
  type DemoPersonaDef,
  type DemoPersonaId,
} from "../lib/demo-portal-config";
import { syncDemoClerkUser } from "../lib/demo-clerk-sync";
import { logger } from "../lib/logger";
import { getOrCreateUser, updateUser } from "./users.service";
import { buildPlatformLegalAcceptance, hasCurrentPlatformLegal } from "../lib/platform-legal-gate";
import { usersTable } from "@workspace/db";

const ROSTER_ROLES: DemoTenantRole[] = ["owner", "manager", "desk", "staff"];

function getClerk() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;
  return createClerkClient({ secretKey });
}

function getDemoPassword(): string {
  return process.env.LIVIA_DEMO_PASSWORD?.trim() || "LiviaDemo2026!";
}

async function ensureDemoPlatformLegal(userId: string, email: string, fullName: string) {
  await getOrCreateUser(userId, email, fullName);
  const [row] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (row && hasCurrentPlatformLegal(row.platformLegal)) return;
  await updateUser(userId, {
    platformLegal: buildPlatformLegalAcceptance("demo-provision"),
  });
}

async function upsertMembership(
  businessId: string,
  userId: string,
  role: "OWNER" | "ADMIN" | "STAFF",
) {
  const [existing] = await db
    .select()
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.businessId, businessId),
        eq(businessMembershipsTable.userId, userId),
      ),
    );
  if (existing) {
    if (existing.role !== role) {
      await db
        .update(businessMembershipsTable)
        .set({ role, updatedAt: new Date() })
        .where(eq(businessMembershipsTable.id, existing.id));
    }
    return;
  }
  await db.insert(businessMembershipsTable).values({
    id: generateId(),
    businessId,
    userId,
    role,
  });
}

async function ensureClerkForDef(def: DemoPersonaDef): Promise<string | null> {
  const clerk = getClerk();
  if (!clerk) return null;
  const password = getDemoPassword();
  const existing = await withClerkRetry(() =>
    clerk.users.getUserList({ emailAddress: [def.email], limit: 1 }),
  );
  let userId: string;
  if (existing.data[0]) {
    userId = existing.data[0].id;
    await syncDemoClerkUser(clerk, userId, { email: def.email, password });
  } else {
    const created = await withClerkRetry(() =>
      clerk.users.createUser({
        emailAddress: [def.email],
        firstName: def.firstName,
        lastName: def.lastName,
        password,
        skipPasswordChecks: true,
        skipPasswordRequirement: true,
      }),
    );
    userId = created.id;
    await syncDemoClerkUser(clerk, userId, { email: def.email, password });
  }
  await ensureDemoPlatformLegal(userId, def.email, def.displayName);
  return userId;
}

function membershipRoleFor(def: DemoPersonaDef): "OWNER" | "ADMIN" | "STAFF" {
  if (def.id === "owner" || def.id === "org_admin") return "OWNER";
  if (def.membershipRole === "STAFF") return "STAFF";
  return "ADMIN";
}

/** Per-tenant demo roster — owner + manager + desk + staff @demo.livia-hq.com */
export async function seedDemoBusinessRosters(): Promise<{ accounts: number; slugs: number }> {
  const rows = await db
    .select({ id: businessesTable.id, slug: businessesTable.slug, name: businessesTable.name })
    .from(businessesTable)
    .where(inArray(businessesTable.slug, [...DEMO_WORLD_SLUGS]));

  const tasks = rows.flatMap((row) =>
    ROSTER_ROLES.map((role) => ({ row, role })),
  );

  const results = await mapWithConcurrency(tasks, 4, async ({ row, role }) => {
      const def = buildDemoRoleDef(row.slug, role, row.name);
      try {
        const userId = await ensureClerkForDef(def);
        if (!userId) return 0;
        await upsertMembership(row.id, userId, membershipRoleFor(def));
        return 1;
      } catch (err) {
        logger.warn({ err, slug: row.slug, role, email: def.email }, "demo.roster.clerk_failed");
        return 0;
      }
  });

  const accounts = results.reduce((sum, n) => sum + n, 0);
  logger.info({ accounts, slugs: rows.length }, "demo.business_rosters.seeded");
  return { accounts, slugs: rows.length };
}

export type DemoRosterEntry = {
  role: DemoTenantRole;
  label: string;
  email: string;
  landingPath: string;
  personaId: DemoPersonaId;
};

export function rosterEntriesForSlug(slug: string, businessName: string): DemoRosterEntry[] {
  return ROSTER_ROLES.map((role) => {
    const def = buildDemoRoleDef(slug, role, businessName);
    return {
      role,
      label: def.roleLabel,
      email: def.email,
      landingPath: def.landingPath,
      personaId: def.id,
    };
  });
}

export function demoScenarioSpotlights(): Array<{
  id: string;
  title: string;
  description: string;
  slug: string;
  structure: "solo" | "chain-hq" | "chain-location" | "franchise" | "chair-host";
}> {
  return [
    {
      id: "solo",
      title: "Solo owner",
      description: "One shop, one owner — Conor's Cut Co.",
      slug: "conors-cut-co",
      structure: "solo",
    },
    {
      id: "chain-hq",
      title: "Chain HQ",
      description: "Org admin across Aurora Studio + Mews + Galway",
      slug: "aurora-studio",
      structure: "chain-hq",
    },
    {
      id: "chain-loc",
      title: "Chain location",
      description: "Single location in a multi-site brand",
      slug: "aurora-mews",
      structure: "chain-location",
    },
    {
      id: "franchise",
      title: "Franchisee",
      description: "Bloom Beauty under Aurora franchisor",
      slug: "bloom-beauty-dublin",
      structure: "franchise",
    },
    {
      id: "vertical-medspa",
      title: "Medspa owner",
      description: "Clinical intake + consent flows",
      slug: "clarity-medspa-dublin",
      structure: "solo",
    },
    {
      id: "vertical-body-art",
      title: "Body art studio",
      description: "Proof collab + visit tokens",
      slug: "ink-anchor-galway",
      structure: "solo",
    },
  ];
}

/** Chain locations share org-admin@ for owner quick login. */
export function resolveRosterOwnerEmail(slug: string, chainFounder: boolean): string {
  if (chainFounder) return DEMO_ROLE_EMAILS.orgAdmin;
  return demoRoleEmailForSlug(slug, "owner");
}
