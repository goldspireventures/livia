import { createClerkClient } from "@clerk/express";
import { and, eq, inArray } from "drizzle-orm";
import { db, businessesTable, businessMembershipsTable, staffTable } from "@workspace/db";
import { DEMO_ROLE_EMAILS, demoRoleEmailForSlug, type DemoTenantRole } from "@workspace/demo-logins";
import { listDemoTenantRosterRoles } from "@workspace/policy";
import { mapWithConcurrency, withClerkRetry } from "../lib/async-pool";
import { generateId } from "../lib/id";
import {
  buildDemoRoleDef,
  DEMO_WORLD_SLUGS,
  resolveClerkProvisioningDef,
  type DemoPersonaDef,
  type DemoPersonaId,
} from "../lib/demo-portal-config";
import { syncDemoClerkUser } from "../lib/demo-clerk-sync";
import { logger } from "../lib/logger";
import { getOrCreateUser, updateUser } from "./users.service";
import { updateStaff } from "./staff.service";
import { buildPlatformLegalAcceptance, hasCurrentPlatformLegal } from "../lib/platform-legal-gate";
import { usersTable } from "@workspace/db";

const ALL_ROSTER_ROLES: DemoTenantRole[] = ["owner", "manager", "desk", "staff"];

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
  const clerkDef = resolveClerkProvisioningDef(def);
  const password = getDemoPassword();
  const existing = await withClerkRetry(() =>
    clerk.users.getUserList({ emailAddress: [clerkDef.email], limit: 1 }),
  );
  let userId: string;
  if (existing.data[0]) {
    userId = existing.data[0].id;
    await syncDemoClerkUser(clerk, userId, { email: clerkDef.email, password });
  } else {
    const created = await withClerkRetry(() =>
      clerk.users.createUser({
        emailAddress: [clerkDef.email],
        firstName: clerkDef.firstName,
        lastName: clerkDef.lastName,
        password,
        skipPasswordChecks: true,
        skipPasswordRequirement: true,
      }),
    );
    userId = created.id;
    await syncDemoClerkUser(clerk, userId, { email: clerkDef.email, password });
  }
  await ensureDemoPlatformLegal(userId, clerkDef.email, clerkDef.displayName);
  return userId;
}

function membershipRoleFor(def: DemoPersonaDef): "OWNER" | "ADMIN" | "STAFF" {
  if (def.id === "owner" || def.id === "org_admin") return "OWNER";
  if (def.membershipRole === "STAFF") return "STAFF";
  return "ADMIN";
}

/** Per-tenant demo roster — owner + manager + desk + staff @demo.livia-hq.com */
export async function seedDemoBusinessRosters(opts?: {
  slugs?: string[];
}): Promise<{ accounts: number; slugs: number }> {
  const slugFilter = opts?.slugs?.length ? opts.slugs : [...DEMO_WORLD_SLUGS];
  const rows = await db
    .select({
      id: businessesTable.id,
      slug: businessesTable.slug,
      name: businessesTable.name,
      tier: businessesTable.tier,
    })
    .from(businessesTable)
    .where(inArray(businessesTable.slug, slugFilter));

  const tasks = rows.flatMap((row) => {
    const roles = listDemoTenantRosterRoles({ tier: row.tier });
    return roles.map((role) => ({ row, role }));
  });

  const results = await mapWithConcurrency(tasks, 1, async ({ row, role }) => {
      const def = buildDemoRoleDef(row.slug, role, row.name);
      try {
        const userId = await ensureClerkForDef(def);
        if (!userId) return 0;
        await upsertMembership(row.id, userId, membershipRoleFor(def));
        if (role === "staff") {
          const [staffRow] = await db
            .select({ id: staffTable.id })
            .from(staffTable)
            .where(eq(staffTable.businessId, row.id))
            .limit(1);
          if (staffRow) {
            await updateStaff(row.id, staffRow.id, { userId });
          }
        }
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

export function rosterEntriesForSlug(
  slug: string,
  businessName: string,
  tier?: string | null,
): DemoRosterEntry[] {
  const roles = listDemoTenantRosterRoles({ tier });
  return roles.map((role) => {
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
  /** Business structure — how the org is shaped (not industry). */
  structure: "solo" | "studio" | "chain-hq" | "franchise" | "chair-host";
  /** Gateway grouping: structure vs industry flow testing. */
  group: "structure" | "vertical";
  /** For multi-site: optional second tenant to demo location-only owner. */
  locationOperatorSlug?: string;
}> {
  return [
    // —— Business structure (who you are in the org) ——
    {
      id: "solo",
      title: "Solo owner",
      description: "One person, one shop — home studio or small room (Conor's Cut Co.)",
      slug: "conors-cut-co",
      structure: "solo",
      group: "structure",
    },
    {
      id: "studio",
      title: "Studio with team",
      description: "Owner + stylists + front desk — Luxe Salon & Spa, Dublin",
      slug: "luxe-salon-spa",
      structure: "studio",
      group: "structure",
    },
    {
      id: "chain-hq",
      title: "Multi-site founder",
      description: "Org admin roll-up — Aurora Studio + Mews + Galway",
      slug: "aurora-studio",
      structure: "chain-hq",
      group: "structure",
      locationOperatorSlug: "aurora-mews",
    },
    {
      id: "chair-host",
      title: "Chair-rental host",
      description: "Rent chairs to independents — host floor, rent due (Aurora Studio demo)",
      slug: "aurora-studio",
      structure: "chair-host",
      group: "structure",
    },
    {
      id: "franchise",
      title: "Franchisee",
      description: "Owns Bloom Beauty — franchised under Aurora in demo seed",
      slug: "bloom-beauty-dublin",
      structure: "franchise",
      group: "structure",
    },
    // —— Industry flows (vertical-specific guest + ops paths) ——
    {
      id: "vertical-body-art",
      title: "Body art",
      description: "Consult-first booking, design proof, deposit norms",
      slug: "ink-anchor-galway",
      structure: "solo",
      group: "vertical",
    },
    {
      id: "vertical-medspa",
      title: "Medspa",
      description: "Clinical intake, consent step, mandate defaults",
      slug: "clarity-medspa-dublin",
      structure: "solo",
      group: "vertical",
    },
    {
      id: "vertical-event-vendors",
      title: "Event decor (solo)",
      description: "Enquire → quote → booked — one owner, consult-first pipeline",
      slug: "atelier-decor-dublin",
      structure: "solo",
      group: "vertical",
    },
  ];
}

/** Chain HQ (aurora-studio) uses org-admin@; every other tenant gets owner-{short}@ */
export function isDemoChainHqSlug(slug: string): boolean {
  return slug === "aurora-studio";
}

/** @deprecated use isDemoChainHqSlug — only HQ uses org-admin owner login */
export function resolveRosterOwnerEmail(slug: string, chainHq: boolean): string {
  if (chainHq) return DEMO_ROLE_EMAILS.orgAdmin;
  return demoRoleEmailForSlug(slug, "owner");
}
