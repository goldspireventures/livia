import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getInternalPlatformHealth } from "./internal-platform.service";
import { getPlatformObservability } from "./internal-observability.service";
import { listVerticalCoverageForOps } from "./persona-reports.service";
import { listInternalSupportTickets } from "./internal-support-tickets.service";
import { listInternalFeatureFlags } from "./internal-feature-flags.service";
import {
  buildFounderCommandCenterLinks,
  buildFounderReleaseChecklist,
  buildFounderStagingPrep,
  runFounderProductionChecks,
} from "./founder-cockpit-command-center.service.js";
import { EXEC_AUTOMATIONS } from "./founder-cockpit-automations.service.js";
import { buildExecHatPanels } from "./founder-cockpit-hats.service.js";
import { listCockpitWorkforceAccessGrants } from "./workforce-access-grants.service.js";
import { listRecentExecWorkEventsByHat } from "./exec-work-events.service.js";

function hoursBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, (b - a) / (1000 * 60 * 60));
}

function tryReadJsonFile(relPath: string): unknown | null {
  try {
    const root = join(process.cwd());
    const full = join(root, relPath);
    if (!existsSync(full)) return null;
    const text = readFileSync(full, "utf8");
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function getOrgAdminCockpitSnapshot(): Promise<{
  platformHealth: Awaited<ReturnType<typeof getInternalPlatformHealth>>;
  observability: Awaited<ReturnType<typeof getPlatformObservability>>;
  verticalCoverage: Awaited<ReturnType<typeof listVerticalCoverageForOps>>;
  support: {
    openTotal: number;
    urgentOpen: number;
    oldestOpenHours: number | null;
    urgent: Array<{
      id: string;
      businessName: string;
      businessSlug: string;
      category: string;
      priority: "urgent" | "normal" | "low";
      createdAt: string;
      assignedTo: string | null;
    }>;
  };
  rollouts: {
    globalEnabled: Array<{ key: string; description: string | null }>;
    totalFlags: number;
  };
  gate: {
    founderGate: unknown | null;
    wargameReport: unknown | null;
  };
  commandCenter: ReturnType<typeof buildFounderCommandCenterLinks>;
  production: Awaited<ReturnType<typeof runFounderProductionChecks>>;
  release: ReturnType<typeof buildFounderReleaseChecklist>;
  stagingPrep: ReturnType<typeof buildFounderStagingPrep>;
  hats: ReturnType<typeof buildExecHatPanels>;
  automations: typeof EXEC_AUTOMATIONS;
  workforceAccess: Awaited<ReturnType<typeof listCockpitWorkforceAccessGrants>>;
}> {
  const [
    platformHealth,
    observability,
    verticalCoverage,
    openTickets,
    flags,
    production,
    workforceAccess,
  ] = await Promise.all([
    getInternalPlatformHealth(),
    getPlatformObservability(),
    listVerticalCoverageForOps(),
    listInternalSupportTickets({ status: "open,triaged", limit: 200 }),
    listInternalFeatureFlags({ globalOnly: true }),
    runFounderProductionChecks(),
    listCockpitWorkforceAccessGrants(),
  ]);

  const commandCenter = buildFounderCommandCenterLinks();
  const release = buildFounderReleaseChecklist(production.allRequiredOk);
  const stagingPrep = buildFounderStagingPrep();

  const nowIso = new Date().toISOString();
  const urgent = openTickets.data
    .filter((t) => t.triage?.priority === "urgent")
    .slice(0, 12)
    .map((t) => ({
      id: t.id,
      businessName: t.businessName,
      businessSlug: t.businessSlug,
      category: t.category,
      priority: t.triage?.priority ?? "normal",
      createdAt: t.createdAt,
      assignedTo: t.assignedTo,
    }));

  const oldest = openTickets.data.reduce<string | null>((acc, t) => {
    if (!t.createdAt) return acc;
    if (!acc) return t.createdAt;
    return new Date(t.createdAt).getTime() < new Date(acc).getTime() ? t.createdAt : acc;
  }, null);

  const enabledGlobal = flags.flags
    .filter((f) => f.businessId == null && f.isEnabled)
    .slice(0, 20)
    .map((f) => ({ key: String(f.key), description: f.description ?? null }));

  const workByHat = await listRecentExecWorkEventsByHat(5);

  const hats = buildExecHatPanels({
    observability,
    platformHealth,
    support: {
      openTotal: openTickets.total,
      urgentOpen: urgent.length,
      oldestOpenHours: oldest ? Math.round(hoursBetween(oldest, nowIso) * 10) / 10 : null,
    },
    production,
    release,
    rollouts: { globalEnabled: enabledGlobal },
  }).map((hat) => ({
    ...hat,
    recentWork: (workByHat[hat.id] ?? []).map((e) => ({
      id: e.id,
      summary: e.summary,
      actor: e.actor,
      actorLabel: e.actorLabel,
      createdAt: e.createdAt.toISOString(),
    })),
  }));

  // Local/dev: allow reading last gate outputs from repo root if present.
  const founderGate = tryReadJsonFile("founder-gate.json");
  const wargameReport = tryReadJsonFile("wargame-report.json");

  return {
    platformHealth,
    observability,
    verticalCoverage,
    support: {
      openTotal: openTickets.total,
      urgentOpen: urgent.length,
      oldestOpenHours: oldest ? Math.round(hoursBetween(oldest, nowIso) * 10) / 10 : null,
      urgent,
    },
    rollouts: {
      totalFlags: flags.flags.length,
      globalEnabled: enabledGlobal,
    },
    gate: { founderGate, wargameReport },
    commandCenter,
    production,
    release,
    stagingPrep,
    hats,
    automations: EXEC_AUTOMATIONS,
    workforceAccess,
  };
}

