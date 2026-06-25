import { MIGRATION_INGEST_EVENT } from "@workspace/policy";
import { inngest } from "../lib/inngest";
import { executeMigrationIngestJob } from "../services/migration-import-job.service";
import type { MigrationIngestRequest } from "../services/migration-import-job.service";

export const migrationImportJob = inngest.createFunction(
  { id: "migration-import-job", retries: 2 },
  { event: MIGRATION_INGEST_EVENT },
  async ({ event, step }) => {
    const data = event.data as {
      jobId: string;
      businessId: string;
      request: MigrationIngestRequest;
    };

    const result = await step.run("execute-migration-ingest", async () =>
      executeMigrationIngestJob(data.jobId, data.businessId, data.request),
    );

    return {
      jobId: data.jobId,
      businessId: data.businessId,
      totalImported: result.totalImported,
      ok: result.ok,
    };
  },
);
