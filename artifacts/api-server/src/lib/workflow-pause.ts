import { db, workflowPausesTable } from "@workspace/db";
import { and, eq, isNull } from "drizzle-orm";
import { generateId } from "./id";

export async function recordWorkflowPause(
  businessId: string,
  workflowId: string,
  reason: string,
): Promise<void> {
  await db.insert(workflowPausesTable).values({
    id: generateId(),
    businessId,
    workflowId,
    reason: reason.slice(0, 2000),
  });
}

export async function listOpenWorkflowPauses(businessId: string) {
  return db
    .select()
    .from(workflowPausesTable)
    .where(
      and(eq(workflowPausesTable.businessId, businessId), isNull(workflowPausesTable.resolvedAt)),
    );
}

export async function resolveWorkflowPauses(businessId: string, workflowId: string) {
  await db
    .update(workflowPausesTable)
    .set({ resolvedAt: new Date() })
    .where(
      and(
        eq(workflowPausesTable.businessId, businessId),
        eq(workflowPausesTable.workflowId, workflowId),
        isNull(workflowPausesTable.resolvedAt),
      ),
    );
}
