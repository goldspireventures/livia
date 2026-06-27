import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { isOnboardingAppUnlocked } from "@workspace/policy";

const clerkId = process.argv[2] ?? "user_3Fa2cJWMEw5IuG34ksUITMJDRVN";

const rows = await db.select().from(businessesTable).where(eq(businessesTable.ownerId, clerkId));

for (const b of rows) {
  const state = b.onboardingState as {
    currentAct?: string;
    completedActs?: string[];
    percentComplete?: number;
  } | null;
  const unlocked = isOnboardingAppUnlocked(state, b.vertical);
  console.log({
    id: b.id,
    slug: b.slug,
    name: b.name,
    vertical: b.vertical,
    unlocked,
    currentAct: state?.currentAct,
    completedActs: state?.completedActs,
    percent: state?.percentComplete,
    checklist: (b.onboardingState as { checklist?: unknown } | null)?.checklist,
    createdAt: b.createdAt,
  });
}

process.exit(0);
