/**
 * Remove agent-created test shops and repair stuck onboarding act for a founder.
 * Usage: pnpm --filter @workspace/api-server exec tsx --env-file=../../.env scripts/repair-founder-onboarding.ts [email]
 */
import { createClerkClient } from "@clerk/express";
import { db, businessesTable } from "@workspace/db";
import { eq, like, sql } from "drizzle-orm";
import { mergeOnboardingState } from "@workspace/policy";

const email = (process.argv[2] ?? "imdglobal@gmx.com").toLowerCase();
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
const users = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
const clerkId = users.data[0]?.id;
if (!clerkId) {
  console.error("No Clerk user for", email);
  process.exit(1);
}

const testSlugs = await db
  .select({ id: businessesTable.id, slug: businessesTable.slug })
  .from(businessesTable)
  .where(
    sql`${businessesTable.ownerId} = ${clerkId} AND ${businessesTable.slug} LIKE ${"imd-allied-health-test-%"}`,
  );

for (const row of testSlugs) {
  await db.delete(businessesTable).where(eq(businessesTable.id, row.id));
  console.log("deleted test business", row.slug);
}

const [primary] = await db
  .select()
  .from(businessesTable)
  .where(eq(businessesTable.slug, "imd-global-allied-health"));

if (primary && primary.ownerId === clerkId) {
  const state = mergeOnboardingState(primary.onboardingState, {
    currentAct: "a2_shop_profile",
    checklist: {
      ...(typeof primary.onboardingState === "object" && primary.onboardingState
        ? (primary.onboardingState as { checklist?: Record<string, unknown> }).checklist
        : {}),
      migrationIntent: "fresh",
    },
    updatedAt: new Date().toISOString(),
  });
  await db
    .update(businessesTable)
    .set({ onboardingState: state, updatedAt: new Date() })
    .where(eq(businessesTable.id, primary.id));
  console.log("repaired onboarding for imd-global-allied-health → a2_shop_profile");
}

const remaining = await db
  .select({ slug: businessesTable.slug, currentAct: sql<string>`onboarding_state->>'currentAct'` })
  .from(businessesTable)
  .where(eq(businessesTable.ownerId, clerkId));
console.log("remaining owned", remaining);
process.exit(0);
