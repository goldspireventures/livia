import { db, businessesTable, migrationImportJobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  MIGRATION_IMPORT_ASYNC_ROW_THRESHOLD,
  MIGRATION_INGEST_EVENT,
  type MigrationImportJobRecord,
  type MigrationImportJobResult,
  type MigrationImportJobStatus,
  type MigrationImportJobMode,
  onboardingChecklistSchema,
  onboardingStateSchema,
} from "@workspace/policy";
import { generateId } from "../lib/id";
import { inngest, isInngestWorkflowsEnabled } from "../lib/inngest";
import {
  applyMigrationEntityBundle,
  estimateMigrationBundleRows,
  type ApplyMigrationBundleResult,
} from "./apply-migration-bundle.service";
import { mirrorBookingUrlToBundle } from "./booking-url-mirror.service";
import { runMigrationOAuthPull } from "./migration-oauth-import.service";
import { runMigrationPartnerPull } from "./migration-partner-import.service";
import { runMagicStudioImport } from "./universal-import.service";
import type { LiviaMigrationEntityBundle } from "@workspace/policy";

export type MigrationIngestRequest = {
  mode: MigrationImportJobMode;
  sourceId: string;
  brokerId?: string;
  incumbentId?: string;
  externalId?: string;
  bookingUrl?: string;
  fileBundle?: {
    clientsCsv?: string;
    servicesCsv?: string;
    appointmentsCsv?: string;
    staffCsv?: string;
  };
  bundle?: LiviaMigrationEntityBundle;
};

export type MigrationIngestResponse = {
  jobId: string;
  status: MigrationImportJobStatus;
  async: boolean;
  message: string;
  totalImported?: number;
  results?: MigrationImportJobResult[];
};

function toJobRecord(row: typeof migrationImportJobsTable.$inferSelect): MigrationImportJobRecord {
  return {
    id: row.id,
    businessId: row.businessId,
    status: row.status as MigrationImportJobStatus,
    mode: row.mode as MigrationImportJobMode,
    sourceId: row.sourceId,
    totalImported: row.totalImported,
    results: (row.results ?? []) as MigrationImportJobResult[],
    message: row.message,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

async function readExternalIdFromChecklist(businessId: string): Promise<string | undefined> {
  const [biz] = await db
    .select({ onboardingState: businessesTable.onboardingState })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  const parsed = onboardingStateSchema.safeParse(biz?.onboardingState);
  if (!parsed.success) return undefined;
  const checklist = onboardingChecklistSchema.safeParse(parsed.data.checklist);
  return checklist.success ? checklist.data.migrationExternalId : undefined;
}

async function createJob(
  businessId: string,
  mode: MigrationImportJobMode,
  sourceId: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const id = generateId();
  await db.insert(migrationImportJobsTable).values({
    id,
    businessId,
    status: "queued",
    mode,
    sourceId,
    payload,
  });
  return id;
}

async function finishJob(
  jobId: string,
  args: {
    status: MigrationImportJobStatus;
    totalImported: number;
    results: MigrationImportJobResult[];
    message: string;
    error?: string;
  },
): Promise<void> {
  await db
    .update(migrationImportJobsTable)
    .set({
      status: args.status,
      totalImported: args.totalImported,
      results: args.results,
      message: args.message,
      error: args.error ?? null,
      completedAt: new Date(),
    })
    .where(eq(migrationImportJobsTable.id, jobId));
}

export async function getMigrationImportJob(
  businessId: string,
  jobId: string,
): Promise<MigrationImportJobRecord | null> {
  const [row] = await db
    .select()
    .from(migrationImportJobsTable)
    .where(eq(migrationImportJobsTable.id, jobId))
    .limit(1);
  if (!row || row.businessId !== businessId) return null;
  return toJobRecord(row);
}

export async function executeMigrationIngestJob(
  jobId: string,
  businessId: string,
  request: MigrationIngestRequest,
): Promise<ApplyMigrationBundleResult | { ok: boolean; message: string; totalImported: number; results: MigrationImportJobResult[] }> {
  await db
    .update(migrationImportJobsTable)
    .set({ status: "running" })
    .where(eq(migrationImportJobsTable.id, jobId));

  try {
    const result = await runMigrationIngestSync(businessId, request);
    const status: MigrationImportJobStatus =
      result.totalImported > 0 ? (result.ok ? "succeeded" : "partial") : "failed";
    await finishJob(jobId, {
      status,
      totalImported: result.totalImported,
      results: result.results,
      message: result.message,
      error: status === "failed" ? result.message : undefined,
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Migration import failed";
    await finishJob(jobId, {
      status: "failed",
      totalImported: 0,
      results: [],
      message,
      error: message,
    });
    throw err;
  }
}

export async function runMigrationIngestSync(
  businessId: string,
  request: MigrationIngestRequest,
): Promise<{
  ok: boolean;
  message: string;
  totalImported: number;
  results: MigrationImportJobResult[];
}> {
  const results: MigrationImportJobResult[] = [];

  if (request.mode === "oauth_pull") {
    const pull = await runMigrationOAuthPull(businessId, {
      brokerId: request.brokerId,
      incumbentId: request.incumbentId ?? request.sourceId,
    });
    for (const r of pull.results) {
      results.push({ kind: r.kind, imported: r.imported, skipped: r.skipped, errors: r.errors });
    }
    return {
      ok: pull.ok,
      message: pull.message,
      totalImported: pull.totalImported,
      results,
    };
  }

  if (request.mode === "partner_pull") {
    const externalId =
      request.externalId ?? (await readExternalIdFromChecklist(businessId)) ?? "";
    const pull = await runMigrationPartnerPull(businessId, {
      brokerId: request.brokerId,
      incumbentId: request.incumbentId ?? request.sourceId,
      externalId,
    });
    for (const r of pull.results) {
      results.push({ kind: r.kind, imported: r.imported, skipped: r.skipped, errors: r.errors });
    }
    return {
      ok: pull.ok,
      message: pull.message,
      totalImported: pull.totalImported,
      results,
    };
  }

  if (request.mode === "booking_url_mirror") {
    const url = request.bookingUrl ?? "";
    const mirror = await mirrorBookingUrlToBundle(url);
    if (!mirror.ok || mirror.rowCount === 0) {
      return {
        ok: false,
        message: mirror.message,
        totalImported: 0,
        results: [],
      };
    }
    const applied = await applyMigrationEntityBundle(businessId, mirror.bundle);
    for (const r of applied.results) {
      results.push({ kind: r.kind, imported: r.imported, skipped: r.skipped, errors: r.errors });
    }
    return {
      ok: applied.ok,
      message: `${mirror.message} ${applied.message}`.trim(),
      totalImported: applied.totalImported,
      results,
    };
  }

  if (request.mode === "file_bundle" && request.fileBundle) {
    const magic = await runMagicStudioImport(businessId, request.fileBundle);
    let totalImported = 0;
    for (const res of magic.results) {
      if (res.kind === "unknown") continue;
      results.push({
        kind: res.kind,
        imported: res.imported,
        skipped: res.skipped,
        errors: res.errors,
      });
      totalImported += res.imported;
    }
    return {
      ok: totalImported > 0,
      message:
        totalImported > 0
          ? `Imported ${totalImported} row(s) from files.`
          : "No rows imported from files.",
      totalImported,
      results,
    };
  }

  if (request.bundle) {
    const applied = await applyMigrationEntityBundle(businessId, request.bundle);
    for (const r of applied.results) {
      results.push({ kind: r.kind, imported: r.imported, skipped: r.skipped, errors: r.errors });
    }
    return {
      ok: applied.ok,
      message: applied.message,
      totalImported: applied.totalImported,
      results,
    };
  }

  return {
    ok: false,
    message: "No ingest payload provided.",
    totalImported: 0,
    results: [],
  };
}

function estimateAsync(request: MigrationIngestRequest): boolean {
  if (request.bundle) {
    return estimateMigrationBundleRows(request.bundle) >= MIGRATION_IMPORT_ASYNC_ROW_THRESHOLD;
  }
  if (request.fileBundle) {
    const chars = Object.values(request.fileBundle).reduce((n, v) => n + (v?.length ?? 0), 0);
    return chars > 50_000;
  }
  return false;
}

export async function requestMigrationIngest(
  businessId: string,
  request: MigrationIngestRequest,
): Promise<MigrationIngestResponse> {
  const jobId = await createJob(businessId, request.mode, request.sourceId, request as unknown as Record<string, unknown>);
  const useAsync = estimateAsync(request) && isInngestWorkflowsEnabled();

  if (useAsync) {
    await inngest.send({
      name: MIGRATION_INGEST_EVENT,
      data: { jobId, businessId, request },
    });
    return {
      jobId,
      status: "queued",
      async: true,
      message: "Import queued — this may take a few minutes for large exports.",
    };
  }

  const result = await executeMigrationIngestJob(jobId, businessId, request);
  return {
    jobId,
    status: result.totalImported > 0 ? (result.ok ? "succeeded" : "partial") : "failed",
    async: false,
    message: result.message,
    totalImported: result.totalImported,
    results: result.results,
  };
}
