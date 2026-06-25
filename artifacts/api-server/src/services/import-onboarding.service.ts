import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  afterMigrationImportOnboardingState,
  completeOnboardingAct,
  mergeOnboardingState,
  onboardingChecklistSchema,
  onboardingStateSchema,
  type ImportEntityKind,
  type OnboardingActId,
} from "@workspace/policy";
import { recordOnboardingStateChange } from "./onboarding-analytics.service";

export type ImportOnboardingSideEffects = {
  actsCompleted: OnboardingActId[];
  checklistUpdates: Record<string, boolean>;
};

export async function applyImportToOnboarding(
  businessId: string,
  kind: ImportEntityKind,
  importedCount: number,
): Promise<ImportOnboardingSideEffects> {
  const actsCompleted: OnboardingActId[] = [];
  const checklistUpdates: Record<string, boolean> = {
    migrationImported: true,
  };

  if (kind === "services" && importedCount > 0) {
    actsCompleted.push("a3_service_menu");
    checklistUpdates.servicesConfirmed = true;
  }
  if (kind === "staff" && importedCount > 0) {
    actsCompleted.push("a4_team");
  }
  if (importedCount > 0) {
    actsCompleted.push("a11_migration");
  }

  const [biz] = await db
    .select({ onboardingState: businessesTable.onboardingState })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);

  if (!biz?.onboardingState) {
    return { actsCompleted, checklistUpdates };
  }

  const parsed = onboardingStateSchema.safeParse(biz.onboardingState);
  if (!parsed.success) return { actsCompleted, checklistUpdates };

  let next = parsed.data;
  const switching = parsed.data.checklist?.migrationIntent === "switching";

  if (switching && importedCount > 0) {
    next = afterMigrationImportOnboardingState({
      ...next,
      checklist: onboardingChecklistSchema.parse({
        ...next.checklist,
        ...checklistUpdates,
      }),
    });
  } else {
    for (const act of actsCompleted) {
      next = completeOnboardingAct(next, act);
    }
    const checklist = onboardingChecklistSchema.parse({
      ...next.checklist,
      ...checklistUpdates,
    });
    next = mergeOnboardingState(next, { checklist });
  }

  await db
    .update(businessesTable)
    .set({ onboardingState: next as unknown as Record<string, unknown> })
    .where(eq(businessesTable.id, businessId));

  await recordOnboardingStateChange({
    businessId,
    before: parsed.data,
    after: next,
  });

  return {
    actsCompleted: switching ? next.completedActs : actsCompleted,
    checklistUpdates,
  };
}
