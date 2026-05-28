import { db, livToolCatalogTable, livBusinessToolOverridesTable } from "@workspace/db";
import {
  listRegisteredTools,
  resolveLivTools,
  type LivRuntimeProfile,
  type LivToolDefinition,
  type ResolveLivToolsInput,
} from "@workspace/liv-runtime";
import { generateId } from "../lib/id";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { appendHumanAudit } from "../lib/audit";

const CATALOG_VERSION = "1.0.0";

/** Mirror code registry → DB so ops can diff and UI can toggle per tenant. */
export async function syncLivToolCatalogFromRegistry(): Promise<number> {
  const tools = listRegisteredTools();
  let upserted = 0;

  for (const t of tools) {
    for (const profile of t.profiles) {
      const id = `${t.id}:${profile}`;
      try {
        await db
          .insert(livToolCatalogTable)
          .values({
            id,
            toolId: t.id,
            version: CATALOG_VERSION,
            profile,
            risk: t.risk,
            description: t.description,
            inputSchema: t.input_schema as Record<string, unknown>,
            enabled: true,
            syncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [livToolCatalogTable.toolId, livToolCatalogTable.profile],
            set: {
              risk: t.risk,
              description: t.description,
              inputSchema: t.input_schema as Record<string, unknown>,
              version: CATALOG_VERSION,
              syncedAt: new Date(),
            },
          });
        upserted += 1;
      } catch (err) {
        logger.warn({ err, toolId: t.id, profile }, "liv tool catalog sync row failed");
      }
    }
  }

  logger.info({ upserted, tools: tools.length }, "liv tool catalog synced");
  return upserted;
}

async function overrideMapForBusiness(
  businessId: string,
  profile: LivRuntimeProfile,
): Promise<Map<string, boolean>> {
  const rows = await db
    .select()
    .from(livBusinessToolOverridesTable)
    .where(
      and(
        eq(livBusinessToolOverridesTable.businessId, businessId),
        eq(livBusinessToolOverridesTable.profile, profile),
      ),
    );
  return new Map(rows.map((r) => [r.toolId, r.enabled]));
}

function isToolEnabled(
  toolId: string,
  catalogDefault: boolean,
  overrides: Map<string, boolean>,
): boolean {
  if (overrides.has(toolId)) return overrides.get(toolId)!;
  return catalogDefault;
}

/** Apply per-tenant overrides to resolved registry tools. */
export async function filterResolvedToolsForBusiness(
  businessId: string,
  profile: LivRuntimeProfile,
  tools: LivToolDefinition[],
): Promise<LivToolDefinition[]> {
  const overrides = await overrideMapForBusiness(businessId, profile);
  const catalogRows = await db
    .select()
    .from(livToolCatalogTable)
    .where(eq(livToolCatalogTable.profile, profile));

  const catalogByTool = new Map(catalogRows.map((r) => [r.toolId, r.enabled]));

  return tools.filter((t) =>
    isToolEnabled(t.name, catalogByTool.get(t.name) ?? true, overrides),
  );
}

export async function resolveLivToolsForBusiness(
  businessId: string,
  input: ResolveLivToolsInput,
): Promise<LivToolDefinition[]> {
  const base = resolveLivTools(input);
  return filterResolvedToolsForBusiness(businessId, input.profile, base);
}

export type LivToolAdminRow = {
  toolId: string;
  profile: LivRuntimeProfile;
  risk: string;
  description: string;
  catalogEnabled: boolean;
  effectiveEnabled: boolean;
  hasOverride: boolean;
};

export async function listLivToolsForBusinessAdmin(
  businessId: string,
  profile: LivRuntimeProfile,
): Promise<LivToolAdminRow[]> {
  const catalog = await db
    .select()
    .from(livToolCatalogTable)
    .where(eq(livToolCatalogTable.profile, profile));

  const overrides = await overrideMapForBusiness(businessId, profile);
  const registered = listRegisteredTools().filter((t) => t.profiles.includes(profile));

  return registered.map((t) => {
    const cat = catalog.find((c) => c.toolId === t.id);
    const catalogEnabled = cat?.enabled ?? true;
    const effectiveEnabled = isToolEnabled(t.id, catalogEnabled, overrides);
    return {
      toolId: t.id,
      profile,
      risk: t.risk,
      description: t.description,
      catalogEnabled,
      effectiveEnabled,
      hasOverride: overrides.has(t.id),
    };
  });
}

export async function setLivToolOverrideForBusiness(args: {
  businessId: string;
  toolId: string;
  profile: LivRuntimeProfile;
  enabled: boolean;
  userId: string;
}): Promise<void> {
  const id = `${args.businessId}:${args.toolId}:${args.profile}`;
  await db
    .insert(livBusinessToolOverridesTable)
    .values({
      id,
      businessId: args.businessId,
      toolId: args.toolId,
      profile: args.profile,
      enabled: args.enabled,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        livBusinessToolOverridesTable.businessId,
        livBusinessToolOverridesTable.toolId,
        livBusinessToolOverridesTable.profile,
      ],
      set: { enabled: args.enabled, updatedAt: new Date() },
    });

  await appendHumanAudit(
    args.businessId,
    args.userId,
    "human.liv.tool.override",
    "business",
    args.businessId,
    { toolId: args.toolId, profile: args.profile, enabled: args.enabled },
  );
}

export async function listLivToolCatalog(profile?: LivRuntimeProfile) {
  const rows = await db.select().from(livToolCatalogTable);
  const filtered = profile ? rows.filter((r) => r.profile === profile && r.enabled) : rows;
  return filtered.map((r) => ({
    toolId: r.toolId,
    profile: r.profile,
    version: r.version,
    risk: r.risk,
    description: r.description,
    enabled: r.enabled,
  }));
}
