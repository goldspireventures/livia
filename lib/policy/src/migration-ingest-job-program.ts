/**
 * Migration import job model — sync vs async (Inngest) ingest.
 */
import type { ImportEntityKind } from "./import-formats";

export const MIGRATION_INGEST_EVENT = "migration/import.requested" as const;

export type MigrationImportJobMode =
  | "oauth_pull"
  | "partner_pull"
  | "file_bundle"
  | "booking_url_mirror";

export type MigrationImportJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "partial";

/** Row count above this triggers async Inngest job when workflows enabled */
export const MIGRATION_IMPORT_ASYNC_ROW_THRESHOLD = 400;

export type MigrationImportJobResult = {
  kind: ImportEntityKind | "bundle";
  imported: number;
  skipped: number;
  errors?: string[];
};

export type MigrationImportJobRecord = {
  id: string;
  businessId: string;
  status: MigrationImportJobStatus;
  mode: MigrationImportJobMode;
  sourceId: string;
  totalImported: number;
  results: MigrationImportJobResult[];
  message: string;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
};
